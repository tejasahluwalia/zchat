import { handle } from 'hono/aws-lambda';
import { DynamoStorage } from '@openauthjs/openauth/storage/dynamo';
import { Resource } from 'sst';
// import { MemoryStorage } from '@openauthjs/openauth/storage/memory';

import { CodeUI } from '@openauthjs/openauth/ui/code';
import { CodeProvider } from '@openauthjs/openauth/provider/code';
import { GithubProvider } from '@openauthjs/openauth/provider/github';
import { issuer } from '@openauthjs/openauth';
import { subjects } from './subjects';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schema, usersTable } from '../src/lib/schemas/drizzleSchema';
import { nanoid } from 'nanoid';

// import 'dotenv/config';
// const connUrl = process.env.ZERO_UPSTREAM_DB!;

const connConfig = {
	user: Resource.ZchatDB.username,
	password: Resource.ZchatDB.password,
	host: Resource.ZchatDB.host,
	port: Resource.ZchatDB.port,
	database: Resource.ZchatDB.database
};
const connUrl = `postgresql://${connConfig.user}:${connConfig.password}@${connConfig.host}:${connConfig.port}/${connConfig.database}`;

async function getUser(email: string) {
	const db = drizzle(connUrl, {
		schema
	});
	const user = await db.query.usersTable.findFirst({
		where: (users, { eq }) => eq(users.email, email)
	});
	return user?.id;
}

async function createUser(email: string) {
	const db = drizzle(connUrl, {
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

const app = issuer({
	// export default issuer({
	subjects,
	storage: DynamoStorage({
		table: 'zchat-auth-table',
		pk: 'pk',
		sk: 'sk'
	}),
	// storage: MemoryStorage(),
	// Remove after setting custom domain
	allow: async () => true,
	providers: {
		code: CodeProvider(
			CodeUI({
				sendCode: async (email, code) => {
					console.log(email, code);
				}
			})
		),
		github: GithubProvider({
			clientID: Resource.GithubOauthClientID.value,
			clientSecret: Resource.GithubOauthClientSecret.value,
			scopes: ['user:email']
		})
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
		if (value.provider === 'github') {
			const { tokenset } = value;
			const ghEmail = await fetch('https://api.github.com/user/emails', {
				headers: {
					Authorization: `Bearer ${tokenset.access}`
				}
			});
			const emails = await ghEmail.json();
			const primaryEmail = emails.find((email) => email.primary)?.email || emails[0]?.email;

			if (!primaryEmail) {
				throw new Error('No email found from GitHub');
			}

			const user = await getUser(primaryEmail);
			if (!user) {
				const newUser = await createUser(primaryEmail);
				return ctx.subject('user', { id: String(newUser) });
			}
			return ctx.subject('user', { id: String(user) });
		}
		throw new Error('Invalid provider');
	}
});

export const handler = handle(app);
