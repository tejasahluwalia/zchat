import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { client, setTokens } from '$lib/server/auth';
import { subjects } from '$lib/subjects';

export const actions = {
	default: async (event) => {
		const { cookies } = event;
		const accessToken = cookies.get('access_token');
		const refreshToken = cookies.get('refresh_token');

		if (accessToken) {
			const verified = await client.verify(subjects, accessToken, {
				refresh: refreshToken
			});
			if (!verified.err && verified.tokens) {
				setTokens(event, verified.tokens.access, verified.tokens.refresh);
				redirect(302, '/');
			}
		}

		const host = event.url.host;
		const protocol = host?.includes('localhost') || host?.includes('192.168') ? 'http' : 'https';
		const { url } = await client.authorize(`${protocol}://${host}/auth/callback`, 'code');
		redirect(302, url);
	}
} satisfies Actions;
