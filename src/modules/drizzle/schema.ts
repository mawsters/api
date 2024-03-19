import {integer, json, pgTable, primaryKey, varchar} from 'drizzle-orm/pg-core'
import {createInsertSchema} from 'drizzle-zod'
import {Book, BookSources} from 'src/core/types/shelvd.types'

// export const countries = pgTable('countries', {
//   id: serial('id').primaryKey(),
//   name: varchar('name', { length: 256 }),
// })
// export const cities = pgTable('cities', {
//   id: serial('id').primaryKey(),
//   name: varchar('name', { length: 256 }),
//   countryId: integer('country_id').references(() => countries.id),
// })

// export const cityRelation = relations(cities, ({ one }) => ({
//   country_city: one(countries, {
//     fields: [cities.countryId],
//     references: [countries.id],
//   }),
// }))

export const corelists = pgTable(
  'corelists',
  {
    key: varchar('key', {length: 256}),
    slug: varchar('slug', {length: 256}).notNull(),
    source: varchar('source', {length: 256, enum: BookSources}),

    name: varchar('name', {length: 256}),
    description: varchar('description', {length: 256}).default(''),
    booksCount: integer('booksCount').default(0),
    books: json('books').$type<Book[]>().default([]),
    creatorKey: varchar('creatorKey', {length: 256}).notNull(),
  },
  (table) => ({
    pk: primaryKey({columns: [table.slug, table.creatorKey]}),
    pkWithCustomName: primaryKey({
      name: 'slug_creatorKey',
      columns: [table.slug, table.creatorKey],
    }),
  }),
)
export const insertCoreListSchema = createInsertSchema(corelists)

export const createdlists = pgTable(
  'createdlists',
  {
    key: varchar('key', {length: 256}),
    slug: varchar('slug', {length: 256}).notNull(),
    source: varchar('source', {length: 256, enum: BookSources}),

    name: varchar('name', {length: 256}),
    description: varchar('description', {length: 256}).default(''),
    booksCount: integer('booksCount').default(0),
    books: json('books').$type<Book[]>().default([]),
    creatorKey: varchar('creatorKey', {length: 256}).notNull(),
  },
  (table) => ({
    pk: primaryKey({columns: [table.slug, table.creatorKey]}),
    pkWithCustomName: primaryKey({
      name: 'slug_creatorKey',
      columns: [table.slug, table.creatorKey],
    }),
  }),
)
export const insertCreatedListSchema = createInsertSchema(createdlists)
