import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const { cookies } = event;
	const accessToken = cookies.get('access_token');
	const refreshToken = cookies.get('refresh_token');

	cookies.delete('access_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });
	return redirect(302, '/');
};
