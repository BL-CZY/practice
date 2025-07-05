<script lang="ts">
	let { data } = $props();
	let { message } = $derived(data);
</script>

<p>Login error: {message}</p>
<a href="/auth">Back</a>
