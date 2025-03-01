import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Resource } from 'sst';
import { schema } from '../../schemas/drizzleSchema';

const conn = `postgresql://${Resource.ZchatDB.username}:${Resource.ZchatDB.password}@${Resource.ZchatDB.host}:${Resource.ZchatDB.port}/${Resource.ZchatDB.database}`;
export const db = drizzle({
	connection: {
		connectionString: conn,
		ssl: true
	},
	schema: schema
});
