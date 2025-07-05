<script lang="ts">
	// --- Imports ---
	import extractCsvData from '$lib/csv';
	import CsvDisplay from '$lib/csv-display.svelte';
	import SpendingTrend from '$lib/spending-chart.svelte';
	import SavingGoals from '$lib/saving-goals.svelte';
	import CategoryChart from '$lib/category-chart.svelte';
	import { untrack } from 'svelte';
	import Chatbot from '$lib/chatbot.svelte';
	import { uploadAndAnalyze, type BudgetAnalysisResult } from '$lib/frontend-api';
	import BudgetFeedback from '$lib/budget-feedback.svelte';

	let goals: Goal[] = $state([]); // Initialize goals state

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

	let raw = $state('');

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
			raw = text;
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

		untrack(() => {
			getAlert();
			getWarning();
			getSuggestions();
		});

		$inspect('categoryInfo', categoryInfo);
	});

	let report: BudgetAnalysisResult | null = $state(null);

	$effect(() => {
		categories;
		if (categories.length > 0) {
			setTimeout(async () => {
				report = await uploadAndAnalyze(raw, categoryInfo);
			});
		}
	});

	async function getCategories(time: number = 3) {
		const list = getDebitDescriptions();
		$inspect('list', list);
		const PROMPT = `Analyze the following list of items (each with a description and index) and group them into main categories PROVIDED. Return ONLY a valid JSON array of objects, each with a "category" (string) and "indices" (array of numbers for the matching items). Do not include any explanations, formatting, or additional text.
You must use the following categories:
Rent, Groceries, Utilities, Entertainment, Transportation, Dining Out, Shopping, Health, Travel, Other
If an item does not fit any of these categories, put it in "Other".
If there is a category that is not used, do not include it in the output.
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

	let alert = $state('');
	async function getAlert() {
		if (!categoryInfo || categoryInfo.length === 0) return;
		const prompt = `Given the following spending categories and their sums (in JSON), provide a single concise alert or warning if you notice any concerning spending patterns. If everything looks fine, reply "All clear." Only reply with the alert or "All clear." Do not include explanations. Include some numbers that must have units. The unit is ${table[1][6] || 'EUR'}.

categoryInfo:
${JSON.stringify(categoryInfo, null, 2)}
`;
		//@ts-ignore
		const result = await puter.ai.chat(prompt);
		alert = result;
	}

	let warning = $state('');
	async function getWarning() {
		if (!categoryInfo || categoryInfo.length === 0) return;
		const prompt = `Analyze the following spending categories and their sums (in JSON). If you see any potential financial risks or overspending, reply with a short warning message. If not, reply "No warnings." Only reply with the warning or "No warnings." Do not include explanations. Include some numbers that must have units. The unit is ${table[1][6] || 'EUR'}.

 Include some numbers.categoryInfo:
${JSON.stringify(categoryInfo, null, 2)}
`;
		//@ts-ignore
		const result = await puter.ai.chat(prompt);
		warning = result;
	}

	let suggestions: string[] = $state([]);
	async function getSuggestions() {
		if (!categoryInfo || categoryInfo.length === 0) return;
		const prompt = `Given the following spending categories and their sums (in JSON), suggest up to 3 actionable tips to improve financial health. Reply as a JSON array of strings. Do not include any explanations or formatting. Include some numbers that must have units. The unit is ${table[1][6] || 'EUR'}.

categoryInfo:
${JSON.stringify(categoryInfo, null, 2)}

Expected output format:
["Tip 1", "Tip 2", "Tip 3"]
`;
		//@ts-ignore
		const result = await puter.ai.chat(prompt);
		try {
			suggestions = JSON.parse(result);
		} catch {
			suggestions = [];
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

<div class="bg-base-200 min-h-screen p-2 sm:p-4 lg:p-6">
	<!-- Header Section -->
	<div class="mb-6 lg:mb-8">
		<h1 class="text-base-content text-2xl font-bold lg:text-3xl">Smart Save</h1>
		<p class="text-base-content/70 text-sm lg:text-base">
			Upload your CSV file to analyze spending patterns and get insights <br />
			There is an AI assistant that can help you with your budget in the bottom right corner.
		</p>
	</div>

	<!-- Upload Section -->
	<div class="card bg-base-100 mb-6 w-full shadow-lg lg:mb-8">
		<div class="card-body p-4 lg:p-6">
			<h2 class="card-title text-lg lg:text-xl">Upload Data</h2>
			<label class="form-control w-full">
				<div class="label">
					<span class="label-text font-medium">Select CSV file</span>
				</div>
				<input
					type="file"
					accept=".csv"
					class="file-input file-input-bordered file-input-primary w-full"
					onchange={handleFile}
				/>
			</label>
			{#if error}
				<div class="alert alert-error mt-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}
		</div>
	</div>

	{#if table.length > 0}
		<BudgetFeedback
			budgetResult={report}
			unit={(() => {
				if (table.length > 1 && table[1].length > 6) {
					return table[1][6];
				} else {
				}
				return 'EUR'; // Default currency if not found
			})()}
		/>{/if}

	{#if table.length > 0}
		<!-- Dashboard Grid Layout -->
		<div class="space-y-6 lg:space-y-8">
			<!-- Charts Section - Responsive Grid -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 xl:gap-8">
				<!-- Spending Trend Chart -->
				<div class="bg-base-100 shadow-lg">
					<div class="card-body p-4 lg:p-6">
						<h2 class="card-title text-lg lg:text-xl">Spending Trends</h2>
						<div class="h-auto lg:h-80">
							<SpendingTrend {table} />
						</div>
					</div>
				</div>

				<!-- Category Chart -->
				<div class="bg-base-100 shadow-lg">
					<div class="card-body p-4 lg:p-6">
						<h2 class="card-title text-lg lg:text-xl">Category Breakdown</h2>
						<div class="h-auto lg:h-auto">
							<CategoryChart data={categoryInfo} />
						</div>
					</div>
				</div>
			</div>

			<!-- AI Insights Section -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
				<!-- Alerts -->
				{#if alert}
					<div class="card bg-warning/10 border-warning/20 border">
						<div class="card-body p-4 lg:p-6">
							<div class="flex items-start gap-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-warning h-6 w-6 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
								<div>
									<h3 class="text-warning font-semibold">Alert</h3>
									<p class="text-base-content/80 text-sm">{alert}</p>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="card bg-warning/10 border-warning/20 border">
						<div class="card-body p-4 lg:p-6">
							<div class="flex items-start gap-3">
								<div class="loading-spinner text-warning"></div>
								<div>
									<h3 class="text-warning font-semibold">Alert</h3>
									<div class="loading-skeleton-text"></div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Warnings -->
				{#if warning}
					<div class="card bg-error/10 border-error/20 border">
						<div class="card-body p-4 lg:p-6">
							<div class="flex items-start gap-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-error h-6 w-6 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div>
									<h3 class="text-error font-semibold">Warning</h3>
									<p class="text-base-content/80 text-sm">{warning}</p>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="card bg-error/10 border-error/20 border">
						<div class="card-body p-4 lg:p-6">
							<div class="flex items-start gap-3">
								<div class="loading-spinner text-error"></div>
								<div>
									<h3 class="text-error font-semibold">Warning</h3>
									<div class="loading-skeleton-text"></div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Suggestions -->
				{#if suggestions.length > 0}
					<div
						class="card bg-info/10 border-info/20 border {alert || warning
							? 'lg:col-span-1'
							: 'lg:col-span-3'}"
					>
						<div class="card-body p-4 lg:p-6">
							<div class="flex items-start gap-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-info h-6 w-6 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div class="flex-1">
									<h3 class="text-info font-semibold">Suggestions</h3>
									<div class="mt-2 space-y-2">
										{#each suggestions as tip}
											<div class="flex items-start gap-2">
												<div class="bg-info/60 mt-1.5 h-1.5 w-1.5 rounded-full"></div>
												<p class="text-base-content/80 text-sm">{tip}</p>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="card bg-info/10 border-info/20 border">
						<div class="card-body p-4 lg:p-6">
							<div class="flex items-start gap-3">
								<div class="loading-spinner text-error"></div>
								<div>
									<h3 class="text-error font-semibold">Suggestions</h3>
									<div class="loading-skeleton-text"></div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom Section - Goals and Table -->
			<!-- Saving Goals - Sidebar on desktop -->
			<div class="lg:col-span-4 xl:col-span-3">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body p-4 lg:p-6">
						<h2 class="card-title text-lg lg:text-xl">Saving Goals</h2>
						<div class="mt-4 overflow-auto">
							<SavingGoals
								{table}
								updateGoals={(input) => {
									goals = input;
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- CSV Table - Main content area -->
			<div class="lg:col-span-8 xl:col-span-9">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body p-4 lg:p-6">
						<h2 class="card-title text-lg lg:text-xl">Transaction Data</h2>
						<div class="mt-4 overflow-x-auto">
							<CsvDisplay {table} />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<Chatbot
	data={categoryInfo}
	{goals}
	currency={(() => {
		if (table.length > 1 && table[1].length > 6) {
			return table[1][6];
		} else {
			return 'EUR'; // Default currency if not found
		}
	})()}
/>

<!-- Mobile-specific styles -->
<style>
	/* Loading Spinner Animation */
	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 3px solid transparent;
		border-top: 3px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Skeleton Text Animation */
	.loading-skeleton-text {
		height: 16px;
		background: linear-gradient(
			90deg,
			rgba(156, 163, 175, 0.2) 25%,
			rgba(156, 163, 175, 0.4) 50%,
			rgba(156, 163, 175, 0.2) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 2s infinite;
		border-radius: 4px;
		width: 100%;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes loading-dots {
		0%,
		20% {
			content: '';
		}
		40% {
			content: '.';
		}
		60% {
			content: '..';
		}
		80%,
		100% {
			content: '...';
		}
	}

	/* Ensure proper spacing on mobile */
	@media (max-width: 640px) {
		.card-body {
			padding: 1rem;
		}

		.card-title {
			font-size: 1.125rem;
		}

		.loading-spinner {
			width: 20px;
			height: 20px;
			border-width: 2px;
		}
	}

	/* Tablet optimizations */
	@media (min-width: 641px) and (max-width: 1023px) {
		.card-body {
			padding: 1.25rem;
		}
	}

	/* Desktop optimizations */
	@media (min-width: 1024px) {
		.card-body {
			padding: 1.5rem;
		}

		/* Add subtle hover effects on desktop */
		.card:hover {
			transform: translateY(-2px);
			transition: transform 0.2s ease-in-out;
		}
	}

	/* Accessibility - Respect prefers-reduced-motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner,
		.loading-skeleton-text,
		.loading-spinner {
			border-top-color: currentColor;
			opacity: 0.7;
		}
	}
</style>
