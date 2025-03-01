<script lang="ts">
	import type { PageProps } from './$types';
	import { schema, type Schema } from '$lib/schemas/zeroSchema';
	import { Query } from '$lib/zero-svelte/query.svelte';
	import { Z } from '$lib/zero-svelte/z.svelte';
	import { nanoid } from 'nanoid';

	const { data }: PageProps = $props();

	const z = new Z<Schema>({
		userID: data.userId,
		schema: schema,
		kvStore: 'mem',
		server: data.zeroViewSyncer,
		auth: data.zeroJwt
	});

	const chats = new Query(z.current.query.chatsTable.related('messages'));

	interface ChatState {
		newChatTitle: string;
		selectedChatId: string | null;
		newMessage: string;
	}

	let state = $state<ChatState>({
		newChatTitle: '',
		selectedChatId: null,
		newMessage: ''
	});

	let selectedChat = $derived(
		chats.current.find((chat) => chat.id === state.selectedChatId) ?? null
	);

	function createChat() {
		if (!state.newChatTitle.trim()) return;
		console.log('Creating chat:', state.newChatTitle);
		z.current.mutate.chatsTable.insert({
			id: nanoid(),
			title: state.newChatTitle,
			userId: data.userId
		});
		state.newChatTitle = '';
	}

	function deleteChat(chatId: string) {
		console.log('Deleting chat:', chatId);
	}

	function selectChat(chatId: string) {
		state.selectedChatId = chatId;
	}

	function sendMessage() {
		if (!state.newMessage.trim() || !state.selectedChatId) return;

		z.current.mutate.messagesTable.insert({
			id: nanoid(),
			chatId: state.selectedChatId,
			content: state.newMessage,
			sentByUser: true
		});
		state.newMessage = '';
	}
</script>

<div>
	<div class="container mx-auto p-4">
		<div class="mb-8">
			<h1 class="text-2xl font-bold mb-4">Chats</h1>
			<form class="flex gap-2 mb-4">
				<input
					type="text"
					class="border rounded px-3 py-2 flex-grow"
					placeholder="New chat name"
					bind:value={state.newChatTitle}
				/>
				<button
					class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
					onclick={createChat}
				>
					Create Chat
				</button>
			</form>

			<div class="space-y-2">
				{#each chats.current || [] as chat (chat.id)}
					<div class="border rounded p-3 flex justify-between items-center">
						<span class="font-medium">{chat.title || 'Unnamed Chat'}</span>
						<div class="flex gap-2">
							<button class="text-blue-500 hover:text-blue-700" onclick={() => selectChat(chat.id)}>
								Open
							</button>
							<button class="text-red-500 hover:text-red-700" onclick={() => deleteChat(chat.id)}>
								Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>

		{#if selectedChat}
			<div class="border rounded p-4">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">
						{selectedChat.title || 'Unnamed Chat'}
					</h2>
					<button
						class="text-gray-500 hover:text-gray-700"
						onclick={() => (state.selectedChatId = null)}
					>
						Close
					</button>
				</div>

				<div class="h-80 overflow-y-auto border rounded p-3 mb-4 space-y-2">
					{#each selectedChat.messages || [] as message (message.id)}
						<div
							class="p-2 rounded"
							class:bg-gray-100={message.sentByUser}
							class:bg-blue-100={message.sentByUser}
						>
							<div class="font-bold">{message.sentByUser ? 'You' : 'Assistant'}</div>
							<div>{message.content}</div>
						</div>
					{/each}
				</div>

				<form class="flex gap-2">
					<input
						type="text"
						class="border rounded px-3 py-2 flex-grow"
						placeholder="Type a message..."
						bind:value={state.newMessage}
					/>
					<button
						class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
						onclick={sendMessage}
					>
						Send
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>
