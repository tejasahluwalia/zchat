import { handle } from 'hono/aws-lambda';
import { issuer } from '@openauthjs/openauth';
import { CodeUI } from '@openauthjs/openauth/ui/code';
import { CodeProvider } from '@openauthjs/openauth/provider/code';
import { DynamoStorage } from '@openauthjs/openauth/storage/dynamo';
import { subjects } from './subjects';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

const storage = DynamoStorage({
	table: 'zchat-auth-table',
	pk: 'pk',
	sk: 'sk'
});

async function getUser(email: string) {
	const user = await db.query.usersTable.findFirst({
		where: eq(usersTable.email, email)
	});
	return user?.id;
}

async function createUser(email: string) {
	const user = await db.insert(usersTable).values({ email, name: email }).returning();
	return user[0].id;
}

const app = issuer({
	subjects,
	storage,
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
				return ctx.subject('user', { id: newUser });
			}
			return ctx.subject('user', { id: user });
		}
		throw new Error('Invalid provider');
	}
});

export const handler = handle(app);
