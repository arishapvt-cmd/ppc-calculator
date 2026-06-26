/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, real } from 'drizzle-orm/pg-core';

// Users table matching Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Saved campaigns / calculations table
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  platform: text('platform').notNull(), // 'google' | 'meta'
  adSpend: real('ad_spend').notNull(),
  cpc: real('cpc').notNull(),
  conversionRate: real('conversion_rate').notNull(),
  avgOrderValue: real('avg_order_value').notNull(),
  profitMargin: real('profit_margin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
}));
