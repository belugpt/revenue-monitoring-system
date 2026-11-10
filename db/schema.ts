import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const businesses = sqliteTable('businesses', {
 id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
 name: text('name').notNull(), data: text('data').notNull(),
 revision: integer('revision').notNull().default(1), updatedAt: text('updated_at').notNull()
}, t => [index('businesses_owner_idx').on(t.ownerId)]);
