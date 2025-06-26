import { relations } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
});

export const usersRelation = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessions = pgTable('sessions', {
  id: uuid().primaryKey().defaultRandom(),
  userId: text().notNull(),
  nextRefreshToken: text().notNull(),
});

export const sessionsRelation = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
