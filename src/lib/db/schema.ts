import { relations } from 'drizzle-orm';
import { date, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const userStatus = pgEnum('user_status', ['active', 'pending', 'suspended']);

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  status: userStatus().notNull().default('pending'),
});

export const usersRelation = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessions = pgTable('sessions', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  nextRefreshToken: text().notNull(),
  lastAccessed: date().notNull().defaultNow(),
});

export const sessionsRelation = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
