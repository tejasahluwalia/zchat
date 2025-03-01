// import { handle } from 'hono/aws-lambda';
import { issuer } from '@openauthjs/openauth';
import { CodeUI } from '@openauthjs/openauth/ui/code';
import { CodeProvider } from '@openauthjs/openauth/provider/code';
// import { DynamoStorage } from '@openauthjs/openauth/storage/dynamo';
import { MemoryStorage } from '@openauthjs/openauth/storage/memory';
import { subjects } from './subjects';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schema, usersTable } from '../src/lib/schemas/drizzleSchema';
import { nanoid } from 'nanoid';
// import { Resource } from 'sst';
// import pg from 'pg';

import 'dotenv/config';

// const { Client } = pg;

// const connConfig = {
// 	user: Resource.ZchatDB.username,
// 	password: Resource.ZchatDB.password,
// 	host: Resource.ZchatDB.host,
// 	port: Resource.ZchatDB.port,
// 	database: Resource.ZchatDB.database
// };

const connConfig = process.env.ZERO_UPSTREAM_DB!;

// const storage = DynamoStorage({
// 	table: 'zchat-auth-table',
// 	pk: 'pk',
// 	sk: 'sk'
// });

async function getUser(email: string) {
	const db = drizzle(connConfig, {
		schema
	});
	const user = await db.query.usersTable.findFirst({
		where: (users, { eq }) => eq(users.email, email)
	});

	console.log(user);
	return user?.id;
}

async function createUser(email: string) {
	const db = drizzle(connConfig, {
		schema
	});
	const newUser = {
		id: nanoid(),
		name: email,
		email
	};
	const result = await db.insert(usersTable).values(newUser).returning();
	return result[0].id;
}

export default issuer({
	subjects,
	storage: MemoryStorage(),
	// Remove after setting custom domain
	allow: async () => true,
	providers: {
		code: CodeProvider(
			CodeUI({
				sendCode: async (email, code) => {
					console.log(email, code);
				}
			})
		)
	},
	success: async (ctx, value) => {
		if (value.provider === 'code') {
			const user = await getUser(value.claims.email);
			if (!user) {
				const newUser = await createUser(value.claims.email);
				return ctx.subject('user', { id: String(newUser) });
			}
			return ctx.subject('user', { id: String(user) });
		}
		throw new Error('Invalid provider');
	}
});

// export const handler = handle(app);
