import type { RequestEvent } from '@sveltejs/kit';
import { createClient } from '@openauthjs/openauth/client';
import { Resource } from 'sst';

export const client = createClient({
	clientID: 'ZchatWeb',
	issuer: Resource.ZchatAuth.url
});

export function setTokens(event: RequestEvent, access: string, refresh: string): void {
	event.cookies.set('access_token', access, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 34560000
	});
	event.cookies.set('refresh_token', refresh, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 34560000
	});
}
