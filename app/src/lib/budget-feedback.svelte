<!-- BudgetAnalysisDisplay.svelte -->
<script lang="ts">
	import type { BudgetAnalysisResult } from './frontend-api';

	// Props
	let { budgetResult, unit = 'EUR' }: { budgetResult: BudgetAnalysisResult | null; unit: string } =
		$props();

	// Helper functions
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: unit
		}).format(amount);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatPercentage(rate: number) {
		return rate.toFixed(1) + '%';
	}
</script>

{#if budgetResult}
	{#if budgetResult.success}
		<div class="container mx-auto max-w-6xl p-6">
			<!-- Header -->
			<div class="mb-8">
				<h1 class="text-base-content mb-2 text-3xl font-bold">Budget Analysis Report</h1>
				<div class="text-base-content/70 text-sm">
					Analysis Date: {formatDate(budgetResult.data.analysisDate)} | Period: {formatDate(
						budgetResult.data.timeframe.startDate
					)} - {formatDate(budgetResult.data.timeframe.endDate)}
				</div>
			</div>

			<!-- Overview Cards -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
				<div class="card bg-primary text-primary-content">
					<div class="card-body">
						<h2 class="card-title text-lg">Total Income</h2>
						<p class="text-3xl font-bold">{formatCurrency(budgetResult.data.totalIncome)}</p>
					</div>
				</div>

				<div class="card bg-secondary text-secondary-content">
					<div class="card-body">
						<h2 class="card-title text-lg">Total Spending</h2>
						<p class="text-3xl font-bold">{formatCurrency(budgetResult.data.totalSpending)}</p>
					</div>
				</div>

				<div class="card bg-accent text-accent-content">
					<div class="card-body">
						<h2 class="card-title text-lg">Monthly Savings</h2>
						<p class="text-3xl font-bold">
							{formatCurrency(budgetResult.data.savingsAnalysis.currentMonthlySavings)}
						</p>
						<p class="text-sm opacity-80">
							Rate: {formatPercentage(budgetResult.data.savingsAnalysis.savingsRate)} out of income
						</p>
					</div>
				</div>
			</div>

			<!-- Budget Analysis Table -->
			<div class="card bg-base-100 mb-8 shadow-xl">
				<div class="card-body">
					<h2 class="card-title mb-4 text-xl">Budget vs Actual Spending</h2>
					<div class="overflow-x-auto">
						<table class="table-zebra table">
							<thead>
								<tr>
									<th>Category</th>
									<th>Budget</th>
									<th>Actual</th>
									<th>Difference</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{#each budgetResult.data.budgetAnalysis as item}
									<tr>
										<td class="font-semibold">{item.category}</td>
										<td>{formatCurrency(item.budgetAmount)}</td>
										<td>{formatCurrency(item.actualSpending)}</td>
										<td class={item.isOverBudget ? 'text-error' : 'text-success'}>
											{formatCurrency(Math.abs(item.difference))}
										</td>
										<td>
											{#if item.isOverBudget}
												<div class="badge badge-error w-max">Over Budget</div>
											{:else}
												<div class="badge badge-success w-max">Under Budget</div>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- Savings Analysis -->
			<div class="card bg-base-100 mb-8 shadow-xl">
				<div class="card-body">
					<h2 class="card-title mb-4 text-xl">Savings Analysis</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<span class="text-base-content/70">Monthly Income:</span>
								<span class="font-semibold"
									>{formatCurrency(budgetResult.data.savingsAnalysis.monthlyIncome)}</span
								>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-base-content/70">Total Spending:</span>
								<span class="font-semibold"
									>{formatCurrency(budgetResult.data.savingsAnalysis.totalSpending)}</span
								>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-base-content/70">Current Monthly Savings:</span>
								<span class="text-success font-semibold"
									>{formatCurrency(budgetResult.data.savingsAnalysis.currentMonthlySavings)}</span
								>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-base-content/70">Projected Monthly Savings:</span>
								<span class="text-info font-semibold"
									>{formatCurrency(budgetResult.data.savingsAnalysis.projectedMonthlySavings)}</span
								>
							</div>
						</div>

						<div class="flex items-center justify-center">
							<div
								class="radial-progress text-success"
								style="--value:{budgetResult.data.savingsAnalysis.savingsRate * 100};"
								role="progressbar"
							>
								{formatPercentage(budgetResult.data.savingsAnalysis.savingsRate)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Recommendations -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title mb-4 text-xl">Recommendations</h2>
					<div class="space-y-3">
						{#each budgetResult.data.savingsAnalysis.recommendations as recommendation, index}
							<div class="alert alert-info">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									class="h-6 w-6 shrink-0 stroke-current"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								<span>{recommendation}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Error State -->
		<div class="container mx-auto max-w-4xl p-6">
			<div class="alert alert-error">
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
				<div>
					<h3 class="font-bold">Error Loading Budget Analysis</h3>
					<div class="text-xs">{budgetResult.error}</div>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<!-- Loading State -->
	<div class="container mx-auto max-w-4xl p-6">
		<div class="flex min-h-64 items-center justify-center">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	</div>
{/if}
