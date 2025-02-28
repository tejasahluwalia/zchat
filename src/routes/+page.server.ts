import { client, setTokens } from '$lib/server/auth';
import { subjects } from '../../auth/subjects';
import { error, json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const cookies = event.cookies;
	const accessToken = cookies.get('access_token');
	const refreshToken = cookies.get('refresh_token');

	if (!accessToken) {
		return { userId: null };
	}

	const verified = await client.verify(subjects, accessToken, {
		refresh: refreshToken
	});

	if (verified.err) {
		return { userId: null };
	}
	if (verified.tokens) {
		setTokens(event, verified.tokens.access, verified.tokens.refresh);
	}

	event.locals.user = verified.subject;

	return { userId: verified.subject.properties.id };
};
