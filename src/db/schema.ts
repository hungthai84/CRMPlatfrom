import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'session_logs' table.
export const sessionLogs = pgTable('session_logs', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  email: text('email').notNull(),
  loginTime: timestamp('login_time').notNull(),
  logoutTime: timestamp('logout_time'),
  activeTime: integer('active_time').default(0).notNull(),
  status: text('status').notNull(), // 'active', 'completed', 'timeout'
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  sessionLogs: many(sessionLogs),
}));
