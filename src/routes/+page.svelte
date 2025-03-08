<script lang="ts">
	import type { PageProps } from './$types';
	import { schema, type Schema } from '$lib/schemas/zeroSchema';
	import { Query } from '$lib/zero-svelte/query.svelte';
	import { Z } from '$lib/zero-svelte/z.svelte';
	import { nanoid } from 'nanoid';
	import type { LLMRequest } from './llm/+server';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import { escapeLike } from '@rocicorp/zero';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const { data }: PageProps = $props();

	const z = new Z<Schema>({
		userID: data.userId,
		schema: schema,
		kvStore: 'mem',
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
		searchQuery: string;
	}

	let chatState = $state<ChatState>({
		newChatTitle: '',
		selectedChatId: null,
		newMessage: '',
		searchQuery: ''
	});

	let selectedChat = $derived(
		chats.current.find((chat) => chat.id === chatState.selectedChatId) ?? null
	);

	let messages = $derived(
		selectedChat?.messages.toSorted((a, b) => b.createdAt! - a.createdAt!) ?? []
	);

	const searchResults = $derived(
		chatState.searchQuery.trim()
			? z.current.query.messagesTable
					.where('content', 'LIKE', `%${escapeLike(chatState.searchQuery)}%`)
					.run()
			: []	
	);

	// Initialize selected chat from URL parameter
	$effect(() => {
		const chatId = page.url.searchParams.get('chat');
		if (chatId && chatId !== chatState.selectedChatId) {
			chatState.selectedChatId = chatId;
		}
	});

	async function createChat() {
		if (!chatState.newChatTitle.trim()) return;
		const newChatId = nanoid();
		await z.current.mutate.chatsTable.insert({
			id: newChatId,
			title: chatState.newChatTitle,
			userId: data.userId
		});
		chatState.newChatTitle = '';
		// Select the new chat and update URL
		selectChat(newChatId);
	}

	async function deleteChat(chatId: string) {
		const messagesToDelete = messages.filter((message) => message.chatId === chatId);
		await z.current.mutateBatch((tx) => {
			messagesToDelete.forEach(async (message) => {
				tx.messagesTable.delete({ id: message.id });
			});
			tx.chatsTable.delete({ id: chatId });
		});
	}

	function selectChat(chatId: string) {
		chatState.selectedChatId = chatId;
		// Update URL with the selected chat ID
		const url = new URL(window.location.href);
		url.searchParams.set('chat', chatId);
		goto(url.toString(), { replaceState: true });
	}

	function scrollToMessage(messageId: string) {
		setTimeout(() => {
			const messageElement = document.getElementById(`message-${messageId}`);
			if (messageElement) {
				messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				// Add a brief highlight effect
				messageElement.classList.add('[&_.chat-bubble]:border-primary');
				setTimeout(() => messageElement.classList.remove('[&_.chat-bubble]:border-primary'), 2000);
			}
		}, 100);
	}

	let isGenerating = $state(false);

	async function sendMessage() {
		if (!chatState.newMessage.trim() || !chatState.selectedChatId) return;

		isGenerating = true;
		// Show generating toast
		const toastId = `toast-${Date.now()}`;
		const toast = document.createElement('div');
		toast.innerHTML = `
			<div id="${toastId}" class="toast toast-top toast-center">
				<div class="alert alert-info">
					<span>Generating response...</span>
				</div>
			</div>
		`;
		document.body.appendChild(toast);

		const llmRequestBody: LLMRequest = {
			messages: [
				{
					content: chatState.newMessage,
					role: 'user' as 'user' | 'assistant'
				},
				...messages.map((message) => ({
					content: message.content,
					role: (message.sentByUser ? 'user' : 'assistant') as 'user' | 'assistant'
				}))
			].reverse(),
			chatId: chatState.selectedChatId
		};

		await z.current.mutate.messagesTable.insert({
			id: nanoid(),
			chatId: chatState.selectedChatId,
			content: chatState.newMessage,
			sentByUser: true
		});
		chatState.newMessage = '';

		await fetch('/llm', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(llmRequestBody)
		});
		isGenerating = false;
		// Remove the toast when generation is complete
		document.getElementById(toastId)?.remove();
	}
</script>

<div class="grid grid-cols-12 h-screen">
	<!-- Sidebar for chats -->
	<div class="col-span-2 p-4 border-base-200 border shadow-xl overflow-y-auto flex flex-col justify-between">
		<div>
			<h1 class="text-xl font-bold mb-4">Chats</h1>

			<form class="flex flex-col gap-2 mb-4">
				<input
					type="text"
					class="input"
					placeholder="New chat name"
					bind:value={chatState.newChatTitle}
				/>
				<button class="btn btn-primary" onclick={async () => await createChat()}>
					Create Chat
				</button>
			</form>

			<ul class="list bg-base-200 rounded-box shadow-md">
				{#each chats.current || [] as chat (chat.id)}
					<li class="list-row p-1 items-center" class:bg-base-300={chat.id === chatState.selectedChatId}>
						<a
							class="list-col-grow link block font-medium truncate p-2 w-full"
							href={`/?chat=${chat.id}`}>{chat.title || 'Unnamed Chat'}</a
						>
						<button
							class="btn btn-error btn-soft btn-sm m-2"
							onclick={async () => await deleteChat(chat.id)}
						>
							Delete
						</button>
					</li>
				{/each}
			</ul>
		</div>
		<form method="POST" action="/auth/logout" use:enhance>
			<button class="btn btn-error btn-soft w-full" type="submit">Logout</button>
		</form>
	</div>

	<!-- Main content area -->
	<div class="p-4 flex flex-col w-full max-h-screen col-span-7">
		{#if selectedChat}
			<div class="rounded p-4 flex-1 flex flex-col max-h-full w-3xl mx-auto">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">
						{selectedChat.title || 'Unnamed Chat'}
					</h2>
					<div class="flex items-center gap-3">
						<label class="flex items-center gap-1 text-sm">
							<input
								type="checkbox"
								checked={selectedChat.isPublic}
								onchange={async () => {
									await z.current.mutate.chatsTable.update({
										id: selectedChat.id,
										isPublic: !selectedChat.isPublic
									});
								}}
							/>
							Public
						</label>
						<button
							class="btn btn-sm"
							disabled={!selectedChat.isPublic}
							onclick={() => {
								const url = `${window.location.origin}/shared-chat/${selectedChat.id}`;
								navigator.clipboard.writeText(url);
							}}
						>
							Copy Link
						</button>
					</div>
				</div>

				<div class="flex-1 overflow-y-auto border border-base-300 rounded p-3 mb-4">
					{#each messages || [] as message, idx (message.id)}
						<div
							class="chat"
							class:chat-start={!message.sentByUser}
							class:chat-end={message.sentByUser}
							id={`message-${message.id}`}
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

				<form class="flex gap-2">
					<input
						type="text"
						class="input w-full"
						placeholder="Type a message..."
						bind:value={chatState.newMessage}
					/>
					<button class="btn btn-primary" onclick={async () => await sendMessage()}> Send </button>
				</form>
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center">
					<p class="text-xl mb-2">Select a chat or create a new one</p>
					<p>Your conversations will appear here</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Right sidebar for search -->
	<div class="col-span-3 p-4 border-base-200 border overflow-y-auto">
		<h1 class="text-xl font-bold mb-4">Search</h1>

		<!-- Search box -->
		<div class="mb-4">
			<input
				type="text"
				class="input w-full"
				placeholder="Search messages..."
				bind:value={chatState.searchQuery}
			/>
		</div>

		<!-- Search results -->
		{#if searchResults.length > 0}
			<div class="card bg-base-200 shadow-sm w-full">
				<div class="card-body p-4">
					<h2 class="card-title text-sm">Results ({searchResults.length})</h2>
					<ul class="menu menu-compact w-full">
						{#each searchResults as result (result.id)}
							<li class="w-full">
								<button 
									class="hover:bg-base-200 block transition-colors w-full"
									onclick={() => {
										selectChat(result.chatId);
										scrollToMessage(result.id);
									}}
								>
									<div class="flex flex-col gap-1 w-full">
										<span class="text-xs text-base-content/60">
											Chat: {chats.current.find((c) => c.id === result.chatId)?.title || 'Unknown'}
										</span>
										<span class="text-sm truncate max-w-full">
											{result.content}
										</span>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{:else if chatState.searchQuery.trim()}
			<div class="alert alert-info">
				<span class="text-sm">No results found</span>
			</div>
		{:else}
			<div class="alert alert-info">
				<span class="text-sm">Search across all messages in all chats</span>
			</div>
		{/if}
	</div>
</div>
