import { Resource } from 'sst';
// import { VITE_PUBLIC_SERVER } from '$env/static/private';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const zeroViewSyncer = Resource.ZchatViewSyncer.url;
	// const zeroViewSyncer = `${VITE_PUBLIC_SERVER}`;

	return { userId: undefined, zeroViewSyncer, zeroJwt: undefined };
};
