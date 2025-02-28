import { createZeroSchema } from 'drizzle-zero';
import { ANYONE_CAN, NOBODY_CAN, definePermissions, type Row } from '@rocicorp/zero';
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

// Convert to Zero schema
export const schema = createZeroSchema(
	{
		usersTable,
		chatsTable,
		messagesTable
	},
	{
		// The version of the schema passed to Zero.
		version: 1,

		// Specify the casing style to use for the schema.
		// This is useful for when you want to use a different casing style than the default.
		// This works in the same way as the `casing` option in the Drizzle ORM.
		//
		// @example
		// casing: "snake_case",
		casing: 'camelCase',

		// Specify which tables and columns to include in the Zero schema.
		// This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
		// When a column is first added, it should be set to false, and then changed to true
		// once the migration has been run.

		// All tables/columns must be defined, but can be set to false to exclude them from the Zero schema.
		// Column names match your Drizzle schema definitions
		tables: {
			// this can be set to false
			// e.g. user: false,
			usersTable: {
				id: true,
				email: true,
				name: true,
				createdAt: true
			},
			chatsTable: {
				id: true,
				title: true,
				userId: true,
				createdAt: true
			},
			messagesTable: {
				id: true,
				content: true,
				chatId: true,
				createdAt: true,
				sentByUser: true
			}
		}
	}
);

// Define permissions with the inferred types from Drizzle
export type Schema = typeof schema;
export type User = Row<typeof schema.tables.usersTable>;
export type Message = Row<typeof schema.tables.messagesTable>;
export type Chat = Row<typeof schema.tables.chatsTable>;

export const permissions: ReturnType<typeof definePermissions> = definePermissions<{}, Schema>(
	schema,
	() => {
		return {
			usersTable: {
				row: {
					select: ANYONE_CAN,
					insert: ANYONE_CAN,
					update: {
						preMutation: NOBODY_CAN
					},
					delete: ANYONE_CAN
				}
			},
			messagesTable: {
				row: {
					select: ANYONE_CAN,
					insert: ANYONE_CAN,
					update: {
						preMutation: NOBODY_CAN
					},
					delete: ANYONE_CAN
				}
			},
			chatsTable: {
				row: {
					select: ANYONE_CAN,
					insert: ANYONE_CAN,
					update: {
						preMutation: NOBODY_CAN
					},
					delete: ANYONE_CAN
				}
			}
		};
	}
);
