import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

export const userStatus = pgEnum('user_status', ['active', 'pending', 'suspended']);

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  status: userStatus().notNull(),
});

export const usersRelation = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessions = pgTable('sessions', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => users.id),
  nextRefreshToken: text().notNull(),
});

export const sessionsRelation = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
