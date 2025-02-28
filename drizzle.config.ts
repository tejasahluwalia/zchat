import { Resource } from 'sst';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: ['./db/schema.ts'],
	out: './db/migrations',
	dbCredentials: {
		host: Resource.ZchatDB.host,
		port: Resource.ZchatDB.port,
		user: Resource.ZchatDB.username,
		password: Resource.ZchatDB.password,
		database: Resource.ZchatDB.database
	}
});
