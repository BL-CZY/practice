<script lang="ts">
	import { trend } from '$lib/chart';

	const { table }: { table: string[][] } = $props();

	// --- Spending Trend Chart Data ---
	let spendingTrendLabels: string[] = $state([]);
	// use without state so chartjs will work properly
	let spendingTrendData: number[] = [];

	// Compute spending trend from CSV (group by month)
	$effect(() => {
		if (table.length > 1) {
			const dateIdx = table[0].findIndex((h) => h.trim().toLowerCase() === 'date');
			const amountIdx = table[0].findIndex((h) => h.trim().toLowerCase() === 'amount');
			const typeIdx = table[0].findIndex((h) => h.trim().toLowerCase() === 'type');
			if (dateIdx !== -1 && amountIdx !== -1 && typeIdx !== -1) {
				const monthly: Record<string, number> = {};
				for (const row of table.slice(1)) {
					const dateStr = row[dateIdx];
					const amt = parseFloat(row[amountIdx]);
					const type = row[typeIdx].trim().toLowerCase();
					if (!dateStr || isNaN(amt)) continue;
					const month = dateStr.slice(0, 7); // YYYY-MM
					// Only count debits as spending
					if (type === 'debit') {
						monthly[month] = (monthly[month] ?? 0) + Math.abs(amt);
					}
				}
				const sortedMonths = Object.keys(monthly).sort();
				spendingTrendLabels = sortedMonths;
				spendingTrendData = sortedMonths.map((m) => monthly[m]);
			} else {
				spendingTrendLabels = [];
				spendingTrendData = [];
			}
		} else {
			spendingTrendLabels = [];
			spendingTrendData = [];
		}
	});

	// Chart.js config for spending trend
	let spendingTrendConfig = $derived({
		type: 'line',
		id: 'spending-trend',
		data: {
			labels: spendingTrendLabels,
			datasets: [
				{
					label: 'Monthly Spending',
					data: spendingTrendData,
					borderColor: 'rgba(255, 99, 132, 1)',
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					tension: 0.4,
					fill: true
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: 'top' }
			},
			scales: {
				y: { beginAtZero: true }
			}
		}
	});
</script>

{#if table.length > 1 && spendingTrendLabels.length > 0}
	<div class="card bg-base-200 mb-8 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Spending Trend</h2>
			<div class="h-64">
				<canvas use:trend={spendingTrendConfig}></canvas>
			</div>
		</div>
	</div>
{/if}
