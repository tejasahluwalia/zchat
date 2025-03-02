import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deepseek } from '@ai-sdk/deepseek';
import { smoothStream, streamText } from 'ai';
import { ZERO_UPSTREAM_DB } from '$env/static/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import { messagesTable, schema } from '$lib/schemas/drizzleSchema';
import { nanoid } from 'nanoid';

const connUrl = ZERO_UPSTREAM_DB;

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

	const { textStream } = streamText({
		model: deepseek('deepseek-chat'),
		messages,
		experimental_transform: smoothStream({
			delayInMs: 2000,
			chunking: 'line'
		})
	});

	for await (const textPart of textStream) {
		console.log(textPart);
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
