<script lang="ts">
	import { ChartCreatorInstance } from '$lib/chart';

	let { data }: { data: { category: string; sum: number }[] } = $props();

	// Prepare labels and data for the pie chart
	let pieLabels = $derived.by(() => {
		data.map((d) => d.category);
	});
	let pieData = $derived.by(() => {
		data.map((d) => d.sum);
	});

	$effect(() => {
		accualData = data;
	});

	let accualData = [];

	// Pie chart config
	let pieConfig = $derived({
		type: 'pie',
		id: 'category-pie',
		data: {
			labels: data.map((d) => d.category),
			datasets: [
				{
					label: 'Spending by Category',
					data: data.map((d) => d.sum),
					backgroundColor: [
						'#f87171',
						'#60a5fa',
						'#34d399',
						'#fbbf24',
						'#a78bfa',
						'#f472b6',
						'#38bdf8',
						'#facc15'
					]
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: 'top' }
			}
		}
	});
</script>

{#if data.length > 0}
	<div class="card bg-base-200 mb-8 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Spending by Category</h2>
			<div class="h-[500px] lg:h-auto">
				<canvas use:ChartCreatorInstance.pie={pieConfig}></canvas>
			</div>
		</div>
	</div>
{:else}
	<div class="card bg-base-200 mb-8 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Spending by Category</h2>
			<div class="flex h-auto items-center justify-center">
				<div class="flex flex-col items-center gap-4">
					<div class="loading loading-spinner loading-lg text-primary"></div>
					<p class="text-base-content/70 text-sm font-medium">Loading spending data...</p>
				</div>
			</div>
		</div>
	</div>
{/if}
