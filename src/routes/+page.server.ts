import { Resource } from 'sst';
import { ZERO_AUTH_SECRET, VITE_PUBLIC_SERVER } from '$env/static/private';

import { client, setTokens } from '$lib/server/auth';
import { subjects } from '../../auth/subjects';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { SignJWT } from 'jose';

function must<T>(val: T | undefined): T {
	if (val === undefined) {
		throw new Error('Expected value to be defined');
	}
	return val;
}

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

	if (verified.tokens) {
		await setTokens(event, verified.tokens.access, verified.tokens.refresh);
	}

	event.locals.userId = verified.subject.properties.id;

	const zeroJwt = await new SignJWT({ sub: event.locals.userId.toString() })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('30days')
		// .sign(new TextEncoder().encode(must(Resource.ZeroAuthSecret.value)));
		.sign(new TextEncoder().encode(must(ZERO_AUTH_SECRET)));

	// const zeroViewSyncer = Resource.ZchatViewSyncer.url;
	const zeroViewSyncer = `${VITE_PUBLIC_SERVER}`;

	return { userId: verified.subject.properties.id, zeroViewSyncer, zeroJwt };
};
