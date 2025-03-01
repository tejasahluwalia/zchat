import { handle } from 'hono/aws-lambda';
import { issuer } from '@openauthjs/openauth';
import { CodeUI } from '@openauthjs/openauth/ui/code';
import { CodeProvider } from '@openauthjs/openauth/provider/code';
import { DynamoStorage } from '@openauthjs/openauth/storage/dynamo';
import { subjects } from './subjects';
import { Resource } from 'sst';
import pg from 'pg';
const { Client } = pg;

const connConfig = {
	user: Resource.ZchatDB.username,
	password: Resource.ZchatDB.password,
	host: Resource.ZchatDB.host,
	port: Resource.ZchatDB.port,
	database: Resource.ZchatDB.database
};

console.log(connConfig);

const storage = DynamoStorage({
	table: 'zchat-auth-table',
	pk: 'pk',
	sk: 'sk'
});

async function getUser(email: string) {
	const client = new Client(connConfig);
	await client.connect();
	const result = await client.query('SELECT * FROM "users" WHERE email = $1::text', [email]);
	await client.end();
	return result.rows[0]?.id;
}

async function createUser(email: string) {
	const client = new Client(connConfig);
	await client.connect();
	const result = await client.query(
		'INSERT INTO "users" (email, name) VALUES ($1::text, $2::text) RETURNING id',
		[email, email]
	);
	await client.end();
	return result.rows[0].id;
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
