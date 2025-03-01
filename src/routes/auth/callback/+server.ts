import { client, setTokens } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const { url } = event;
	const code = url.searchParams.get('code');

	const exchanged = await client.exchange(code!, `${url.origin}/auth/callback`);

	if (exchanged.err) return error(400, exchanged.err);

	await setTokens(event, exchanged.tokens.access, exchanged.tokens.refresh);

	return redirect(302, `${url.origin}/`);
};
