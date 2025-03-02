<script lang="ts">
	import type { PageProps } from './$types';
	import { schema, type Schema } from '$lib/schemas/zeroSchema';
	import { Query } from '$lib/zero-svelte/query.svelte';
	import { Z } from '$lib/zero-svelte/z.svelte';
	import { nanoid } from 'nanoid';
	import type { LLMRequest } from './llm/+server';

	const { data }: PageProps = $props();

	const z = new Z<Schema>({
		userID: data.userId,
		schema: schema,
		kvStore: 'idb',
		server: `${data.zeroViewSyncer}`,
		auth: data.zeroJwt,
		logLevel: 'debug'
	});

	const chats = new Query(
		z.current.query.chatsTable.related('messages').orderBy('createdAt', 'desc')
	);

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

	let messages = $derived(
		selectedChat?.messages.toSorted((a, b) => a.createdAt! - b.createdAt!) ?? []
	);

	async function createChat() {
		if (!state.newChatTitle.trim()) return;
		await z.current.mutate.chatsTable.insert({
			id: nanoid(),
			title: state.newChatTitle,
			userId: data.userId
		});
		state.newChatTitle = '';
	}

	async function deleteChat(chatId: string) {
		await z.current.mutate.chatsTable.delete({ id: chatId });
	}

	function selectChat(chatId: string) {
		state.selectedChatId = chatId;
	}

	async function sendMessage() {
		if (!state.newMessage.trim() || !state.selectedChatId) return;

		await z.current.mutate.messagesTable.insert({
			id: nanoid(),
			chatId: state.selectedChatId,
			content: state.newMessage,
			sentByUser: true
		});
		state.newMessage = '';

		const llmRequestBody: LLMRequest = {
			messages: selectedChat?.messages.map((message) => ({
				content: message.content,
				role: message.sentByUser ? 'user' : 'assistant'
			})) ?? [{ content: 'The user sent an empty message by mistake.', role: 'user' }],
			chatId: state.selectedChatId
		};

		await fetch('/llm', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(llmRequestBody)
		});
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
					onclick={async () => await createChat()}
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
							<button
								class="text-red-500 hover:text-red-700"
								onclick={async () => await deleteChat(chat.id)}
							>
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
					{#each messages || [] as message, idx (message.id)}
						<div
							class="p-2 rounded"
							class:bg-gray-100={message.sentByUser}
							class:bg-blue-100={message.sentByUser}
						>
							{#if idx > 0 && messages[idx - 1].sentByUser !== message.sentByUser}
								<div class="font-bold">{message.sentByUser ? 'You' : 'Assistant'}</div>
							{/if}
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
						onclick={async () => await sendMessage()}
					>
						Send
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>
