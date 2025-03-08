<script lang="ts">
	import type { PageProps } from './$types';
	import { schema, type Schema } from '$lib/schemas/zeroSchema';
	import { Query } from '$lib/zero-svelte/query.svelte';
	import { Z } from '$lib/zero-svelte/z.svelte';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import { page } from '$app/state';

	const { data }: PageProps = $props();
	const { id: chatId } = page.params;

	const z = new Z<Schema>({
		userID: 'anon',
		schema: schema,
		kvStore: 'mem',
		server: `${data.zeroViewSyncer}`,
		auth: undefined,
		logLevel: 'debug'
	});

	const chatQuery = new Query(
		z.current.query.chatsTable
			.where('id', chatId)
			.one()
			.related('messages')
			.orderBy('createdAt', 'desc')
	);

	let chat = $derived(chatQuery.current);

	let messages = $derived(chat?.messages.toSorted((a, b) => b.createdAt! - a.createdAt!) ?? []);
</script>

<div class="flex h-screen">
	<!-- Main content area -->
	<div class="p-4 flex flex-col w-full max-h-screen max-w-3xl mx-auto">
		{#if chat}
			<div class="border rounded p-4 flex-1 flex flex-col max-h-full w-3xl mx-auto">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">
						{chat.title || 'Unnamed Chat'}
					</h2>
				</div>

				<div class="flex-1 overflow-y-auto border border-base-300 rounded p-3 mb-4">
					{#each messages || [] as message, idx (message.id)}
						<div
							class="chat"
							class:chat-start={!message.sentByUser}
							class:chat-end={message.sentByUser}
						>
							{#if idx === 0 || messages[idx - 1].sentByUser !== message.sentByUser}
								<div class="chat-header text-sm mb-2">{message.sentByUser ? 'You' : 'Assistant'}</div>
							{/if}
							<div class="chat-bubble px-4 py-0 [&_p]:my-4 [&_pre]:overflow-auto [&_hr]:border-gray-400 [&_hr]:my-2">
								<SvelteMarkdown source={message.content} />
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center text-gray-500">
				<div class="text-center">
					<p class="text-xl mb-2">Select a chat or create a new one</p>
					<p>Your conversations will appear here</p>
				</div>
			</div>
		{/if}
	</div>

</div>
