<script lang="ts">
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { themeChange } from 'theme-change';

	let {
		logoutHook = () => {},
		type = 'private'
	}: { logoutHook?: () => void; type?: 'private' | 'main' } = $props();

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function handleLogout() {
		logoutHook();
		isMenuOpen = false;
	}

	// NOTE: the element that is using one of the theme attributes must be in the DOM on mount
	onMount(() => {
		themeChange(false);
		// 👆 false parameter is required for svelte
	});
</script>

<div class="navbar bg-base-100 px-4 shadow-lg">
	<!-- Left side - Home button -->
	<div class="navbar-start">
		{#if type === 'private'}
			<a href="/private" class="btn btn-ghost text-xl font-bold">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Home
			</a>
		{:else if type === 'main'}
			<a href="/" class="btn btn-ghost text-xl font-bold">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Home
			</a>
		{/if}
	</div>

	<!-- Center - can add navigation items here -->
	<div class="navbar-center hidden lg:flex">
		<!-- Add other nav items here if needed -->
	</div>

	{#if type === 'private'}
		<!-- Right side - Menu toggle -->
		<div class="navbar-end">
			<input type="checkbox" value="light" class="toggle theme-controller" />
			<div class="dropdown dropdown-end flex items-center justify-center">
				<button class="btn btn-ghost" onclick={() => toggleMenu()} aria-label="Open user menu">
					<div class="w-10 rounded-full">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					</div>

					<p>Account</p>
				</button>

				{#if isMenuOpen}
					<ul
						class="bg-base-100 rounded-box border-base-300 menu fixed right-4 top-16 z-[1] w-52 border p-2 shadow-lg"
						transition:scale
					>
						<li>
							<button
								onclick={handleLogout}
								class="text-error hover:bg-error hover:text-error-content"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Logout
							</button>
						</li>
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>
