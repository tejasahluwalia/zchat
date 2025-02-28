<script lang="ts">
	import type { PageData } from './$types';
	import { Resource } from 'sst'
	import { Query } from '$lib/query.svelte.js';
	import { Z } from '$lib/z.svelte.js';
	import { schema, type Schema } from "$lib/zero/schema"

	const z = new Z<Schema>({
		server: Resource.ZchatViewSyncer.url,
		schema,
		userID: data.userId
	});

	const chats = z.query({
		query: schema.query.chats,
		params: { userID: data.userId }
	})

	export let data: PageData;
</script>

<div>
	{#if data.userId}
		<div>User ID: {data.userId}</div>
		<div>
			{#each chats.data as chat}
				<div>{chat.id}</div>
			{/each}
		</div>
		<form method="GET" action="/auth/logout">
			<button type="submit">Logout</button>
		</form>
	{:else}
		<div>Please log in to view your user ID.</div>
		<form method="POST" action="/login">
			<button type="submit">Login</button>
		</form>
	{/if}
</div>
