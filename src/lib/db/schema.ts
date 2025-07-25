import { relations } from 'drizzle-orm';
import { boolean, date, integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const userStatus = pgEnum('user_status', ['active', 'pending', 'suspended']);

export const userRole = pgEnum('user_role', ['staff', 'volunteer', 'admin']);

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: userRole().notNull(),
  status: userStatus().notNull().default('pending'),
});

export const usersRelation = relations(users, ({ many }) => ({
  sessions: many(sessions),
  meals: many(meals),
}));

export const sessions = pgTable('sessions', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: date()
    .notNull()
    .default(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()), // 30 days
  createdAt: date().notNull().defaultNow(),
  revoked: boolean().notNull().default(false),
});

export const sessionsRelation = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const meals = pgTable('meals', {
  id: uuid().primaryKey().defaultRandom(),
  staffCreatorId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  adult: integer().notNull(),
  youth: integer().notNull(),
  inventory: integer().notNull(),
  quantity: integer().notNull(),
});

export const mealsRelation = relations(meals, ({ one }) => ({
  staffCreator: one(users, {
    fields: [meals.staffCreatorId],
    references: [users.id],
  }),
}));
