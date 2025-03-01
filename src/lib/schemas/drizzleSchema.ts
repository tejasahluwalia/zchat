import { relations } from 'drizzle-orm';
import { pgTable, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
	id: varchar({ length: 21 }).primaryKey(),
	email: varchar({ length: 255 }).notNull().unique(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp().notNull().defaultNow()
});

export const chatsTable = pgTable('chats', {
	id: varchar({ length: 21 }).primaryKey(),
	title: varchar({ length: 255 }).notNull(),
	userId: varchar({ length: 21 })
		.notNull()
		.references(() => usersTable.id),
	createdAt: timestamp().notNull().defaultNow()
});

export const messagesTable = pgTable('messages', {
	id: varchar({ length: 21 }).primaryKey(),
	content: text().notNull(),
	chatId: varchar({ length: 21 })
		.notNull()
		.references(() => chatsTable.id),
	createdAt: timestamp().notNull().defaultNow(),
	sentByUser: boolean().notNull()
});

export const userRelations = relations(usersTable, ({ many }) => ({
	chats: many(chatsTable)
}));

export const chatRelations = relations(chatsTable, ({ one, many }) => ({
	owner: one(usersTable, {
		fields: [chatsTable.userId],
		references: [usersTable.id]
	}),
	messages: many(messagesTable)
}));

export const messageRelations = relations(messagesTable, ({ one }) => ({
	chat: one(chatsTable, {
		fields: [messagesTable.chatId],
		references: [chatsTable.id]
	})
}));

export const schema = {
	usersTable,
	chatsTable,
	messagesTable,
	userRelations,
	chatRelations,
	messageRelations
};
