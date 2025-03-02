import { createZeroSchema } from 'drizzle-zero';
import {
	NOBODY_CAN,
	definePermissions,
	type Row,
	type ExpressionBuilder
	// type Condition
} from '@rocicorp/zero';
import { schema as drizzleSchema } from './drizzleSchema';

// Convert to Zero schema
export const schema = createZeroSchema(drizzleSchema, {
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
			isPublic: true,
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
});

// Define permissions with the inferred types from Drizzle
export type Schema = typeof schema;
// type TableName = keyof Schema['tables'];

export type User = Row<typeof schema.tables.usersTable>;
export type Message = Row<typeof schema.tables.messagesTable>;
export type Chat = Row<typeof schema.tables.chatsTable>;

// type PermissionRule<TTable extends TableName> = (
// 	authData: AuthData,
// 	eb: ExpressionBuilder<Schema, TTable>
// ) => Condition;

// function and<TTable extends TableName>(...rules: PermissionRule<TTable>[]): PermissionRule<TTable> {
// 	return (authData, eb) => eb.and(...rules.map((rule) => rule(authData, eb)));
// }

type AuthData = {
	sub: string;
};

export const permissions: ReturnType<typeof definePermissions> = definePermissions<
	AuthData,
	Schema
>(schema, () => {
	const userIDMatchesLoggedInUser = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'usersTable'>
	) => cmp('id', '=', authData.sub);

	const allowIfChatOwner = (authData: AuthData, eb: ExpressionBuilder<Schema, 'chatsTable'>) =>
		eb.exists('owner', (q) => q.where((eb) => userIDMatchesLoggedInUser(authData, eb)));

	const allowIfMessageOwner = (
		authData: AuthData,
		eb: ExpressionBuilder<Schema, 'messagesTable'>
	) => eb.exists('chat', (q) => q.where((eb) => allowIfChatOwner(authData, eb)));

	const allowIfChatPublic = (authData: AuthData, eb: ExpressionBuilder<Schema, 'chatsTable'>) =>
		eb.cmp('isPublic', '=', true);

	const canSeeChat = (authData: AuthData, eb: ExpressionBuilder<Schema, 'chatsTable'>) =>
		eb.or(allowIfChatPublic(authData, eb), allowIfChatOwner(authData, eb));

	return {
		usersTable: {
			row: {
				select: [userIDMatchesLoggedInUser],
				insert: NOBODY_CAN,
				update: {
					preMutation: NOBODY_CAN
				},
				delete: NOBODY_CAN
			}
		},
		messagesTable: {
			row: {
				select: [allowIfMessageOwner],
				insert: [allowIfMessageOwner],
				update: {
					preMutation: [allowIfMessageOwner],
					postMutation: [allowIfMessageOwner]
				},
				delete: [allowIfMessageOwner]
			}
		},
		chatsTable: {
			row: {
				select: [canSeeChat],
				insert: [allowIfChatOwner],
				update: {
					preMutation: [allowIfChatOwner],
					postMutation: [allowIfChatOwner]
				},
				delete: [allowIfChatOwner]
			}
		}
	};
});
