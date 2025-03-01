import { relations } from 'drizzle-orm';
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
	userId: integer()
		.notNull()
		.references(() => usersTable.id),
	createdAt: timestamp().notNull().defaultNow()
});

export const messagesTable = pgTable('messages', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	content: text().notNull(),
	chatId: integer()
		.notNull()
		.references(() => chatsTable.id),
	createdAt: timestamp().notNull().defaultNow(),
	sentByUser: boolean().notNull()
});

export const userChatRelation = relations(usersTable, ({ many }) => ({
	chats: many(chatsTable)
}));

export const chatUserRelation = relations(chatsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [chatsTable.userId],
		references: [usersTable.id]
	})
}));

export const chatMessageRelation = relations(chatsTable, ({ many }) => ({
	messages: many(messagesTable)
}));

export const messageChatRelation = relations(messagesTable, ({ one }) => ({
	chat: one(chatsTable, {
		fields: [messagesTable.chatId],
		references: [chatsTable.id]
	})
}));

export const schema = {
	usersTable,
	chatsTable,
	messagesTable,
	userChatRelation,
	chatUserRelation,
	chatMessageRelation,
	messageChatRelation
};
