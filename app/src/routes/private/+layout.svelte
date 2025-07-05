<script>
	import Nav from '$lib/nav.svelte';

	let { data, children } = $props();
	let { supabase } = $derived(data);

	const logout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
		}
	};
</script>

<header>
	<Nav logoutHook={logout} />
</header>
<main>
	{@render children()}
</main>
