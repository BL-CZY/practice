<script lang="ts">
	// --- Imports ---
	import extractCsvData from '$lib/csv';
	import CsvDisplay from '$lib/csv-display.svelte';
	import SpendingTrend from '$lib/spending-chart.svelte';
	import SavingGoals from '$lib/saving-goals.svelte';
	import CategoryChart from '$lib/category-chart.svelte';

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

	function getDebitDescriptions() {
		if (!table || table.length < 2) return [];
		const header = table[0].map((h) => h.trim().toLowerCase());
		const descIdx = header.indexOf('description');
		const typeIdx = header.indexOf('type');
		if (descIdx === -1 || typeIdx === -1) return [];
		console.log('end');
		return table
			.slice(1)
			.map((row, i) => ({
				description: row[descIdx],
				index: i,
				type: row[typeIdx]?.trim().toLowerCase()
			}))
			.filter((item) => item.type === 'debit')
			.map(({ description, index }) => ({ description, index }));
	}

	let categories: { category: string; indices: number[] }[] = $state([]);
	let categoryInfo: {
		category: string;
		sum: number;
	}[] = $state([]);

	let b = true;
	$effect(() => {
		categories;
		$inspect('categories', categories);
		categories.forEach((cat) => {
			let a = table.filter((_row, i) => {
				return cat.indices.includes(i - 1); // -1 to account for header row
			});

			if (b) {
				$inspect(a);
				b = false;
			}
		});
		let res = categories.map((cat) => ({
			category: cat.category,
			sum: Math.abs(
				table
					.filter((_row, i) => {
						return cat.indices.includes(i - 1);
					})
					.map((row) => parseFloat(row[3]) || 0)
					.reduce((a, b) => a + b, 0)
			)
		}));
		categoryInfo = res;
		$inspect('categoryInfo', categoryInfo);
	});

	async function getCategories(time: number = 3) {
		const list = getDebitDescriptions();
		$inspect('list', list);
		const PROMPT = `Analyze the following list of items (each with a description and index) and group them into main categories. Return ONLY a valid JSON array of objects, each with a "category" (string) and "indices" (array of numbers for the matching items). Do not include any explanations, formatting, or additional text.

Items:
${JSON.stringify(list, null, 2)}

Requirements:
- Return only valid JSON format
- Use an array of objects: [{"category": "category1", "indices": [1,2]}, ...]
- Keep category names concise (1-3 words)
- Avoid duplicates
- No explanations or additional text
- The indices should acctually match the indices in the original list

Expected output format:
[{"category": "category1", "indices": [1,2]}, {"category": "category2", "indices": [3]}]`;
		console.log('Prompt:', PROMPT);

		//@ts-ignore
		let result = (await puter.ai.chat(PROMPT)) as string;

		try {
			categories = JSON.parse(result) as { category: string; indices: number[] }[];
		} catch (e) {
			if (time <= 0) {
				error = 'Failed to parse categories. Please reupload and try again.';
			}
			getCategories(time - 1);
		}
	}

	$effect(() => {
		// Typescript intelliscence won't recognize puter as a global variable because it's external
		// but it will be available at runtime
		table;
		getCategories(); // Call to ensure puter is initialized
	});
</script>

<svelte:head>
	<script src="https://js.puter.com/v2/"></script>
</svelte:head>

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

	{#if table.length > 0}
		<!-- =========================
         Spending Trend Chart Section
        ========================= -->
		<SpendingTrend {table} />
		<CategoryChart data={categoryInfo} />

		<!-- =========================
         Saving Goals Section
        ========================= -->
		<SavingGoals {table} />

		<!-- =========================
             CSV Table Section
        ========================= -->
		<CsvDisplay {table} />
	{/if}
</div>
