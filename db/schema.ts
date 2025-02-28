import { integer, pgTable, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	email: varchar({ length: 255 }).notNull().unique(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp().notNull().defaultNow()
});

export const chatsTable = pgTable('chats', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 255 }).notNull(),
	userId: integer().notNull(),
	createdAt: timestamp().notNull().defaultNow()
});

export const messagesTable = pgTable('messages', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	content: text().notNull(),
	chatId: integer().notNull(),
	createdAt: timestamp().notNull().defaultNow(),
	sentByUser: boolean().notNull()
});

export const schema = {
	usersTable,
	chatsTable,
	messagesTable
};
