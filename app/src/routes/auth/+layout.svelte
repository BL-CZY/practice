<script>
	import Nav from '$lib/nav.svelte';

	let { children } = $props();
</script>

<header>
	<Nav type="main" />
</header>

{@render children()}
