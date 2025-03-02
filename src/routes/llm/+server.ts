import { Resource } from 'sst';
// import { ZERO_UPSTREAM_DB } from '$env/static/private';

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { smoothStream, streamText } from 'ai';
import { drizzle } from 'drizzle-orm/postgres-js';
import { messagesTable, schema } from '$lib/schemas/drizzleSchema';
import { nanoid } from 'nanoid';

// const connUrl = ZERO_UPSTREAM_DB;
const connConfig = {
	user: Resource.ZchatDB.username,
	password: Resource.ZchatDB.password,
	host: Resource.ZchatDB.host,
	port: Resource.ZchatDB.port,
	database: Resource.ZchatDB.database
};
const connUrl = `postgresql://${connConfig.user}:${connConfig.password}@${connConfig.host}:${connConfig.port}/${connConfig.database}`;

export type LLMRequest = {
	chatId: string;
	messages: {
		role: 'user' | 'assistant';
		content: string;
	}[];
};

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	const body = await request.json();
	const { chatId, messages } = body as LLMRequest;

	const db = drizzle(connUrl, {
		schema
	});

	const deepseek = createDeepSeek({
		apiKey: Resource.DeepseekApiKey.value
	});

	const { textStream } = streamText({
		model: deepseek('deepseek-chat'),
		messages,
		experimental_transform: smoothStream({
			delayInMs: 2000,
			chunking: 'line'
		})
	});

	for await (const textPart of textStream) {
		await db.insert(messagesTable).values({
			id: nanoid(),
			chatId: chatId,
			sentByUser: false,
			content: textPart
		});
	}

	return json({
		status: 200
	});
};
