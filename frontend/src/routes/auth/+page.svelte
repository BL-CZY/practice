<script lang="ts">
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let is_signup = $state(false);
	let error = $state('');

	function switchToSignup() {
		is_signup = true;
		error = '';
		password = '';
		confirmPassword = '';
	}

	function switchToLogin() {
		is_signup = false;
		error = '';
		password = '';
		confirmPassword = '';
	}

	function handleSignup(event: Event) {
		error = '';
		if (password.length < 6) {
			error = 'Password must be at least 6 characters.';
			event.preventDefault();
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			event.preventDefault();
			return;
		}
	}
</script>

<div class="bg-base-200 flex min-h-screen items-center justify-center px-4">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-6 text-center text-2xl font-bold">
				{is_signup ? 'Create Account' : 'Welcome Back'}
			</h2>

			{#if !is_signup}
				<form method="POST" action="?/login">
					<div class="form-control mb-4">
						<label class="label" for="email">
							<span class="label-text font-medium">Email</span>
						</label>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							placeholder="Enter your email"
							class="input input-bordered focus:input-primary w-full"
							required
						/>
					</div>

					<div class="form-control mb-6">
						<label class="label" for="password">
							<span class="label-text font-medium">Password</span>
						</label>
						<input
							id="password"
							name="password"
							type="password"
							bind:value={password}
							placeholder="Enter your password"
							class="input input-bordered focus:input-primary w-full"
							required
						/>
						<span class="label">
							<button type="submit" formaction="?/reset" class="label-text-alt link link-hover">
								Forgot password?
							</button>
						</span>
					</div>

					<div class="form-control mt-6 space-y-3">
						<button type="submit" class="btn btn-primary w-full">Login</button>
					</div>
				</form>
			{:else}
				<form method="POST" action="?/signup" onsubmit={handleSignup}>
					<div class="form-control mb-4">
						<label class="label" for="email">
							<span class="label-text font-medium">Email</span>
						</label>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							placeholder="Enter your email"
							class="input input-bordered focus:input-primary w-full"
							required
						/>
					</div>

					<div class="form-control mb-4">
						<label class="label" for="password">
							<span class="label-text font-medium">Password</span>
						</label>
						<input
							id="password"
							name="password"
							type="password"
							bind:value={password}
							placeholder="Enter your password"
							class="input input-bordered focus:input-primary w-full"
							required
						/>
					</div>

					<div class="form-control mb-6">
						<label class="label" for="confirmPassword">
							<span class="label-text font-medium">Confirm Password</span>
						</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							placeholder="Confirm your password"
							class="input input-bordered focus:input-primary w-full"
							required
						/>
					</div>

					{#if error}
						<p class="text-error mb-2">{error}</p>
					{/if}

					<div class="form-control mt-6 space-y-3">
						<button type="submit" class="btn btn-primary w-full">Sign Up</button>
					</div>
				</form>
			{/if}

			<div class="divider">OR</div>

			<div class="text-center">
				{#if !is_signup}
					<p class="text-base-content/70 text-sm">Don't have an account?</p>
					<br />
					<button
						type="button"
						class="btn btn-outline btn-secondary w-full"
						onclick={switchToSignup}
					>
						Create an account
					</button>
				{:else}
					<p class="text-base-content/70 text-sm">Have an account?</p>
					<br />
					<button
						type="button"
						class="btn btn-outline btn-secondary w-full"
						onclick={switchToLogin}
					>
						Login
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
