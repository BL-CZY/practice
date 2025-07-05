<script lang="ts">
	let { data } = $props();
	let { supabase } = $derived(data);

	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');

	function handleSubmit(event: Event) {
		event.preventDefault();
		error = '';
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		supabase.auth
			.updateUser({
				password: password
			})
			.then(({ error: updateError }) => {
				if (updateError) {
					error = updateError.message;
				} else {
					window.location.href = '/private';
				}
			});
	}
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center">
	<div class="bg-base-100 w-full max-w-md rounded-lg p-8 text-center shadow-lg">
		<h1 class="text-primary mb-4 text-2xl font-bold">Reset Password</h1>
		<form class="flex flex-col gap-4" onsubmit={handleSubmit}>
			<input
				type="password"
				class="input input-bordered w-full"
				placeholder="New password"
				bind:value={password}
				required
			/>
			<input
				type="password"
				class="input input-bordered w-full"
				placeholder="Confirm new password"
				bind:value={confirmPassword}
				required
			/>
			{#if error}
				<p class="text-error">{error}</p>
			{/if}
			<button type="submit" class="btn btn-primary w-full">Set New Password</button>
		</form>
	</div>
</div>
