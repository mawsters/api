import {ZodValidationPipe, createZodDto} from '@anatine/zod-nestjs'
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common'
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger'
import {
  DefaultListTypeInfo,
  List,
  ListTypeInfo,
  ListType,
  ListData,
} from 'src/core/types/shelvd.types'
import {z} from 'zod'
import {
  ClerkService,
  GetUserByUsername,
  GetUserByUsernameDTO,
} from '../clerk/clerk.service'
import {
  BulkUpdateListByBookKey,
  BulkUpdateListByBookKeyDTO,
  CreateListDTO,
  DeleteListByTypeDTO,
  GetCreatedList,
  GetList,
  GetLists,
  ListService,
  UpdateListBooksDTO,
  UpdateListByTypeDTO,
} from './list.service'

const GetListByType = z.object({
  type: ListType,
})
class GetListByTypeDTO extends createZodDto(GetListByType) {}

export const GetListByUsername = GetUserByUsername.merge(
  GetCreatedList.omit({userId: true}).extend({
    type: ListType,
  }),
)
export class GetListByUsernameDTO extends createZodDto(GetListByUsername) {}

@Controller('list')
@ApiTags('list')
@UsePipes(ZodValidationPipe)
export class ListController {
  constructor(
    private readonly listService: ListService,
    private readonly clerkService: ClerkService,
  ) {}

  @Get('/slugs')
  @ApiOperation({
    summary: 'Query for the bare minimum info about user ListData',
  })
  @ApiResponse({
    status: '2XX',
    description:
      'Returns a record keyed by ListType with array of partial ListData info',
  })
  async getListSlugsByType(
    @Query() query: GetUserByUsernameDTO,
  ): Promise<ListTypeInfo> {
    // Validate user
    const user = await this.clerkService.getUserByUsername(query)
    if (!user) return DefaultListTypeInfo

    return this.listService.getUserListsKeys(user)
  }

  @Post('/book')
  @ApiOperation({
    summary: 'Bulk insert/delete a book key across all owned lists',
  })
  @ApiResponse({
    status: '2XX',
    description:
      'Returns a record keyed by ListType with array of partial ListData info',
  })
  async updateListMembership(
    @Body() body: BulkUpdateListByBookKeyDTO,
  ): Promise<ListTypeInfo> {
    // Validate user
    const user = await this.clerkService.client.users.getUser(body.userId)
    if (!user) return

    const payload = BulkUpdateListByBookKey.parse({
      ...body,
      userId: user.id,
    })
    await this.listService.bulkUpdateListMembership(payload)
    // if (!isUpdated) return

    return this.listService.getUserListsKeys(user)
  }

  @Post('/create')
  @ApiOperation({summary: 'Create a ListData'})
  @ApiResponse({
    status: '2XX',
    description: 'Returns array of created Lists',
  })
  async createList(@Body() body: CreateListDTO) {
    // Validate user
    const userId = body.creator?.key ?? ''
    const user = await this.clerkService.client.users.getUser(userId)
    if (!user) return []

    return this.listService.createList(body)
  }

  //#endregion  //*======== GENERICS ===========
  @Put(`/:type/update/details`)
  @ApiOperation({
    summary: 'Update a specific ListData (w/ limitations for "core")',
  })
  @ApiResponse({
    status: '2XX',
    description: 'Returns array of updated ListData',
  })
  async updateList(@Body() body: UpdateListByTypeDTO): Promise<ListData[]> {
    // Validate user
    const user = await this.clerkService.client.users.getUser(body.userId)
    if (!user) return []

    Logger.log(`ListController/updateCreatedList`, user, body)

    return this.listService.updateListDetails(body)
  }

  @Put(`/:type/update/books`)
  @ApiOperation({
    summary: 'Update a specific ListData.bookKeys',
  })
  @ApiResponse({
    status: '2XX',
    description: 'Returns array of updated ListData',
  })
  async updateListBooks(@Body() body: UpdateListBooksDTO): Promise<ListData[]> {
    // Validate user
    const user = await this.clerkService.client.users.getUser(body.userId)
    if (!user) return []

    Logger.log(`ListController/updateListBooks`, user, body)

    return this.listService.updateListBooks(body)
  }

  @Delete(`/:type/delete`)
  @ApiOperation({summary: 'Delete a specific ListData (except "core")'})
  @ApiResponse({
    status: '2XX',
    description: 'Returns array of deleted ListData keys',
  })
  async deleteList(
    @Body() body: DeleteListByTypeDTO,
  ): Promise<{key: List['key']}[]> {
    // Validate user
    const user = await this.clerkService.client.users.getUser(body.userId)
    if (!user) return []

    Logger.log(`ListController/deleteCreatedList`, user, body)

    return this.listService.deleteList(body)
  }

  @Get('/:type/all')
  @ApiOperation({summary: 'Query for all user ListData of type'})
  @ApiResponse({
    status: '2XX',
    description: 'Returns array of user-associated ListData',
  })
  async getListByType(
    @Param() param: GetListByTypeDTO,
    @Query() query: GetUserByUsernameDTO,
  ): Promise<ListData[]> {
    // Validate user
    const user = await this.clerkService.getUserByUsername(query)
    if (!user) return []

    const payload = GetLists.parse({
      ...param,
      userId: user.id,
    })
    return this.listService.getUserLists(payload)
  }

  @Get(`/:type`)
  @ApiOperation({summary: 'Query for a specific ListData'})
  @ApiResponse({
    status: '2XX',
    description: 'Returns the ListData only if matched',
  })
  async getList(@Query() query: GetListByUsernameDTO) {
    // Validate user
    const user = await this.clerkService.getUserByUsername(query)
    if (!user) return undefined

    const payload = GetList.parse({
      ...query,
      userId: user.id,
    })

    return this.listService.getList(payload)
  }
  //#endregion  //*======== GENERICS ===========
}
