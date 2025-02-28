import type { RequestHandler } from './$types';
import { client, setTokens } from '$lib/server/auth';
import { subjects } from '../../../auth/subjects';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const cookies = event.cookies;
	const accessToken = cookies.get('access_token');
	const refreshToken = cookies.get('refresh_token');

	if (!accessToken) {
		return error(404, 'Access token not found');
	}

	const verified = await client.verify(subjects, accessToken, {
		refresh: refreshToken
	});

	console.log(verified);

	if (verified.err) {
		return error(401, 'Invalid token');
	}
	if (verified.tokens) {
		setTokens(event, verified.tokens.access, verified.tokens.refresh);
	}

	event.locals.user = verified.subject;

	return json(verified.subject);
};
