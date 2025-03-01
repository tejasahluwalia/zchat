import type { RequestEvent } from '@sveltejs/kit';
import { createClient } from '@openauthjs/openauth/client';
import { Resource } from 'sst';
import { ZERO_AUTH_SECRET } from '$env/static/private';
import { SignJWT } from 'jose';

export const client = createClient({
	clientID: 'ZchatWeb',
	issuer: Resource.ZchatAuth.url
});

function must<T>(val: T | undefined): T {
	if (val === undefined) {
		throw new Error('Expected value to be defined');
	}
	return val;
}

function secure(event: RequestEvent) {
	return event.url.protocol === 'https:';
}

export async function setTokens(event: RequestEvent, access: string, refresh: string) {
	const userId = event.locals.userId.toString();

	const jwt = await new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('30days')
		.sign(new TextEncoder().encode(must(ZERO_AUTH_SECRET)));

	event.cookies.set('zero_auth_token', jwt, {
		path: '/',
		httpOnly: false,
		sameSite: 'strict',
		secure: secure(event),
		maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
	});
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
