<script lang="ts">
	// --- Imports ---
	import extractCsvData from '$lib/csv';
	import CsvDisplay from '$lib/csv-display.svelte';
	import SpendingTrend from '$lib/spending-trend.svelte';
	import SavingGoals from '$lib/saving-goals.svelte';

	// --- CSV Table State ---
	let table: string[][] = $state([]);
	let error = $state('');

	// --- Required CSV Fields (must match and be in order) ---
	const REQUIRED_FIELDS = [
		'',
		'date',
		'description',
		'amount',
		'type',
		'account_number',
		'currency'
	];

	// --- CSV File Upload Handler ---
	function handleFile(event: Event) {
		error = '';
		table = [];
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const parsed = extractCsvData(text);

			if (
				parsed.length === 0 ||
				parsed[0].length !== REQUIRED_FIELDS.length ||
				!REQUIRED_FIELDS.every((field, idx) => parsed[0][idx].trim().toLowerCase() === field)
			) {
				error = 'CSV must have the following columns in order: ' + REQUIRED_FIELDS.join(', ');
				table = [];
				return;
			}

			table = parsed;
		};
		reader.readAsText(file);
	}
</script>

<!-- =========================
     CSV Upload Section
========================= -->
<div class="mx-auto max-w-2xl py-8">
	<label class="mb-4 block">
		<span class="font-medium">Upload CSV file:</span>
		<input
			type="file"
			accept=".csv"
			class="file-input file-input-bordered mt-2 w-full"
			onchange={handleFile}
		/>
	</label>

	{#if error}
		<div class="alert alert-error mb-4">{error}</div>
	{/if}

	<!-- =========================
         Spending Trend Chart Section
    ========================= -->
	<SpendingTrend {table} />

	<!-- =========================
         Saving Goals Section
    ========================= -->

	{#if table.length > 0}
		<!-- =========================
             CSV Table Section
        ========================= -->

		<SavingGoals {table} />
		<CsvDisplay {table} />
	{/if}
</div>
