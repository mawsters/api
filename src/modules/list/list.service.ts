import {createZodDto} from '@anatine/zod-nestjs'
import {User} from '@clerk/clerk-sdk-node'
import {Inject, Injectable, Logger} from '@nestjs/common'
import {PostgresJsDatabase} from 'drizzle-orm/postgres-js'
import {DRIZZLE_ORM} from 'src/core/constants/db.constants'
import {Book, BookSource, List} from 'src/core/types/shelvd.types'
import {ShelvdUtils} from 'src/core/utils/shelvd.utils'
import {z} from 'zod'
import * as schema from '../drizzle/schema'
import {and, eq} from 'drizzle-orm'
import {getUniqueObjectList} from 'src/core/utils/helpers'

export const CreateList = List
export class CreateListDTO extends createZodDto(CreateList) {}

export const GetCreatedList = z.object({
  userId: z.string().min(1).trim(),
  key: z.string().min(1).trim(),
})
export class GetCreatedListDTO extends createZodDto(GetCreatedList) {}

export const UpdateList = GetCreatedList.extend({
  data: List.omit({creator: true}).partial(),
})
export class UpdateListDTO extends createZodDto(UpdateList) {}

@Injectable()
export class ListService {
  constructor(
    @Inject(DRIZZLE_ORM) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  parseLists(dbLists: z.infer<typeof schema.insertCoreListSchema>[]): List[] {
    if (!dbLists.length) return []
    return dbLists.map((list) =>
      List.parse({
        ...list,
        creator: {
          key: list.creatorKey,
        },
      }),
    ) as List[]
  }

  async initAllCoreLists(user: User) {
    Logger.log(`ListService/initAllCoreLists`, user)

    const listNames: string[] = ['To Read', 'Reading', 'Completed', 'DNF']
    const lists = listNames.map((name) => {
      const slug = ShelvdUtils.createSlug(name)
      const source = BookSource.enum.shelvd
      const creatorKey = user.id

      return schema.insertCoreListSchema.parse({
        key: slug,
        slug,
        source,
        name,
        description: '',
        books: [],
        creatorKey,
      })
    })

    return this.db
      .insert(schema.corelists)
      .values(lists as any[])
      .returning()
  }

  async getAllCoreLists(user: User): Promise<List[]> {
    // const isValidParams = GetUserByUsername.safeParse(params).success
    // if (!isValidParams) return []

    Logger.log(`ListService/getAllCoreLists`, user)

    const creatorKey = user.id
    let lists = await this.db.query.corelists.findMany({
      where: (list, {eq}) => eq(list.creatorKey, creatorKey),
    })

    const isInitRequired = !lists.length
    if (isInitRequired) lists = await this.initAllCoreLists(user)

    return this.parseLists(lists)
  }

  async getAllCreatedLists(user: User): Promise<List[]> {
    // const isValidParams = GetUserByUsername.safeParse(params).success
    // if (!isValidParams) return []

    Logger.log(`ListService/getAllCreatedLists`, user)

    const creatorKey = user.id
    const lists = await this.db.query.createdlists.findMany({
      where: (list, {eq}) => eq(list.creatorKey, creatorKey),
    })

    return this.parseLists(lists)
  }

  createList = async (list: CreateListDTO) => {
    const creatorKey = list?.creator?.key ?? ''
    if (!creatorKey) return []

    const lists: List[] = this.parseLists(
      await this.db
        .insert(schema.createdlists)
        .values(
          schema.insertCreatedListSchema.parse({
            ...list,
            creatorKey,
          }) as any,
        )
        .returning(),
    )
    return lists
  }

  getCreatedList = async (payload: GetCreatedListDTO) => {
    // get list by key from db
    return this.db.query.createdlists.findFirst({
      where: (list, {eq, and}) =>
        and(eq(list.creatorKey, payload.userId), eq(list.key, payload.key)),
    })
  }

  updateCreatedList = async (payload: UpdateListDTO) => {
    // get list by key from db
    const list = await this.getCreatedList(payload)
    if (!list) return []

    Logger.log(`ListService/updateCreatedList`, payload, list)

    // push to books
    const listBooks = (list.books ?? []) as Book[]
    const newBooks: Book[] = (payload.data?.books ?? []).map((book) =>
      Book.parse(book),
    )
    if (newBooks.length) listBooks.push(...newBooks)
    const books = getUniqueObjectList(listBooks, 'key')
    const booksCount = books.length

    const updatedList = schema.insertCreatedListSchema.parse({
      ...list,
      ...payload.data,
      books,
      booksCount,
    })

    Logger.log(`ListService/updateCreatedList`, {
      listBooks: listBooks.length,
      newBooks: newBooks.length,
      expectedBooksCount: listBooks.length + newBooks.length,
      booksCount,
    })

    const lists: List[] = this.parseLists(
      await this.db
        .update(schema.createdlists)
        .set(updatedList as any)
        .where(
          and(
            eq(schema.createdlists.key, payload.key),
            eq(schema.createdlists.creatorKey, payload.userId),
          ),
        )
        .returning(),
    )
    return lists
  }

  deleteCreatedList = async (payload: GetCreatedListDTO) => {
    // get list by key from db
    const list = await this.getCreatedList(payload)
    if (!list) return []

    Logger.log(`ListService/deleteCreatedList`, payload, list)

    return await this.db
      .delete(schema.createdlists)
      .where(
        and(
          eq(schema.createdlists.key, payload.key),
          eq(schema.createdlists.creatorKey, payload.userId),
        ),
      )
      .returning()
  }
}
