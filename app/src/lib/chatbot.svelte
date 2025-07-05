<script lang="ts">
	import { onMount } from 'svelte';

	let {
		currency,
		data,
		goals
	}: { currency: string; data: { category: string; sum: number }[]; goals: Goal[] } = $props();
	let messages: { role: 'user' | 'assistant'; content: string }[] = $state([]);
	let userInput = $state('');
	let loading = $state(false);
	let isVisible = $state(false);

	const systemPrompt = $derived(
		`You are a financial assistant. The user's spending data by category is as follows:\n${JSON.stringify(data, null, 2)}\nYou also have access to the user's saving goals: ${JSON.stringify(goals, null, 2)}. Your responses should include numbers, and the currency is ${currency}. Use this data to answer questions and provide insights.`
	);

	async function sendMessage(e: Event) {
		e.preventDefault();
		if (!userInput || loading) return;

		// Add user message
		messages.push({ role: 'user', content: userInput });
		loading = true;

		try {
			//@ts-ignore
			const response = await puter.ai.chat(systemPrompt + userInput);
			messages.push({ role: 'assistant', content: response });
		} catch (error) {
			console.error('Error sending message:', error);
			messages = [
				...messages,
				{ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
			];
		}

		userInput = '';
		loading = false;
	}

	function toggleChatbot() {
		isVisible = !isVisible;
	}

	onMount(() => {
		messages = [
			{
				role: 'assistant',
				content:
					'Hello! I am your financial assistant. Ask me anything about your spending categories or financial health.'
			}
		];
	});
</script>

<!-- Chatbot Panel -->
{#if isVisible}
	<div class="fixed bottom-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
		<div class="card bg-base-100 border-base-300 border shadow-2xl">
			<div class="card-body p-4">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="card-title text-lg">Financial Assistant</h2>
					<button
						class="btn btn-ghost btn-sm btn-square"
						onclick={toggleChatbot}
						aria-label="Close chatbot"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<div class="bg-base-200 scrollbar-thin mb-4 h-64 overflow-y-auto rounded p-3">
					{#each messages as msg}
						<div class="mb-3 last:mb-0">
							<div class="flex items-start gap-2">
								<span
									class="badge badge-sm {msg.role === 'user'
										? 'badge-primary'
										: 'badge-secondary'} shrink-0"
								>
									{msg.role === 'user' ? 'You' : 'AI'}
								</span>
								<span class="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</span>
							</div>
						</div>
					{/each}
					{#if loading}
						<div class="text-base-content/70 flex items-center gap-2">
							<span class="loading loading-dots loading-sm"></span>
							<span class="text-sm italic">Assistant is typing...</span>
						</div>
					{/if}
				</div>

				<form onsubmit={sendMessage} class="flex gap-2">
					<input
						class="input input-bordered input-sm flex-1"
						bind:value={userInput}
						placeholder="Ask about your spending..."
						autocomplete="off"
					/>
					<button
						class="btn btn-primary btn-sm"
						type="submit"
						disabled={loading || !userInput.trim()}
					>
						{#if loading}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							Send
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Toggle Button -->
<button
	class="btn btn-primary btn-circle fixed bottom-4 right-4 z-50 shadow-lg transition-all duration-200 hover:shadow-xl"
	onclick={toggleChatbot}
	aria-label={isVisible ? 'Close financial assistant' : 'Open financial assistant'}
>
	{#if isVisible}
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
			></path>
		</svg>
	{:else}
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>
	{/if}
</button>

<style>
	/* Custom scrollbar for webkit browsers */
	.scrollbar-thin::-webkit-scrollbar {
		width: 6px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: hsl(var(--bc) / 0.2);
		border-radius: 3px;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--bc) / 0.3);
	}
</style>
