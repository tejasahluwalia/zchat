import { Resource } from 'sst';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: ['./src/lib/schemas/drizzleSchema.ts'],
	out: './src/lib/server/db/migrations',
	dbCredentials: {
		host: Resource.ZchatDB.host,
		port: Resource.ZchatDB.port,
		user: Resource.ZchatDB.username,
		password: Resource.ZchatDB.password,
		database: Resource.ZchatDB.database
	}
	// dbCredentials: {
	// 	url: process.env.ZERO_UPSTREAM_DB!
	// }
});
