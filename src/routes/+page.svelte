<script lang="ts">
	import type { PageProps } from './$types';
	import { schema, type Schema } from '$lib/schemas/zeroSchema';
	import { createZero } from '$lib/zero-svelte/create-zero';
	const { data }: PageProps = $props();

	const z = createZero({
		userID: data.userId.toString(),
		schema,
		server: data.zeroViewSyncer,
		kvStore: 'mem'
	});
</script>

<div>
	{#if data.userId}
		<div>User ID: {data.userId}</div>
		<div>
			<!-- {#each chats.data as chat}
				<div>{chat.id}</div>
			{/each} -->
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
	{JSON.stringify(data)}
</div>
