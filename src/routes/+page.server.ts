import { client, setTokens } from '$lib/server/auth';
import { subjects } from '../../auth/subjects';
import { error, json, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { Resource } from 'sst';

export const load: PageServerLoad = async (event) => {
	const cookies = event.cookies;
	const accessToken = cookies.get('access_token');
	const refreshToken = cookies.get('refresh_token');

	if (!accessToken) {
		return redirect(307, '/login');
	}

	const verified = await client.verify(subjects, accessToken, {
		refresh: refreshToken
	});

	if (verified.err) {
		return redirect(307, '/login');
	}

	event.locals.userId = verified.subject.properties.id;

	if (verified.tokens) {
		await setTokens(event, verified.tokens.access, verified.tokens.refresh);
	}

	const zeroViewSyncer = Resource.ZchatViewSyncer.url;

	return { userId: verified.subject.properties.id, zeroViewSyncer };
};
