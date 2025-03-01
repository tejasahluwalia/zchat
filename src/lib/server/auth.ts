import type { RequestEvent } from '@sveltejs/kit';
import { createClient } from '@openauthjs/openauth/client';
// import { Resource } from 'sst';

export const client = createClient({
	clientID: 'ZchatWeb',
	// issuer: Resource.ZchatAuth.url
	issuer: 'http://localhost:3001'
});

function secure(event: RequestEvent) {
	return event.url.protocol === 'https:';
}

export async function setTokens(event: RequestEvent, access: string, refresh: string) {
	event.cookies.set('access_token', access, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 34560000,
		secure: secure(event)
	});
	event.cookies.set('refresh_token', refresh, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 34560000,
		secure: secure(event)
	});
}
