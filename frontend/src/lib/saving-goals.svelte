<script lang="ts">
	import { nanoid } from 'nanoid';
	let { table }: { table: string[][] } = $props();

	// --- Saving Goals State & Types ---
	type Goal = {
		id: string;
		name: string;
		amount: number;
		priority: number;
	};

	let goals: Goal[] = $state([]);
	let newGoalName = $state('');
	let newGoalAmount: number | '' = $state('');

	// --- Saving Goals Logic ---
	function addGoal(e: Event) {
		e.preventDefault();
		if (!newGoalName.trim() || !newGoalAmount || Number(newGoalAmount) <= 0) return;
		const maxPriority = goals.length > 0 ? Math.max(...goals.map((g) => g.priority)) : 0;
		goals = [
			...goals,
			{
				id: nanoid(),
				name: newGoalName.trim(),
				amount: Number(newGoalAmount),
				priority: maxPriority + 1
			}
		];
		newGoalName = '';
		newGoalAmount = '';
	}

	function removeGoal(id: string) {
		goals = goals.filter((g) => g.id !== id);
	}

	function updateGoal(id: string, field: keyof Goal, value: string | number) {
		goals = goals.map((g) =>
			g.id === id
				? { ...g, [field]: field === 'amount' || field === 'priority' ? Number(value) : value }
				: g
		);
	}

	function changePriority(id: string, direction: 'up' | 'down') {
		const idx = goals.findIndex((g) => g.id === id);
		if (idx === -1) return;
		const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (swapIdx < 0 || swapIdx >= goals.length) return;
		// Swap priorities
		const newGoals = [...goals];
		const temp = newGoals[idx].priority;
		newGoals[idx].priority = newGoals[swapIdx].priority;
		newGoals[swapIdx].priority = temp;
		// Sort by priority
		goals = newGoals.sort((a, b) => a.priority - b.priority);
	}

	let allocations: {
		allocated: number;
		id: string;
		name: string;
		amount: number;
		priority: number;
	}[] = $state([]);

	// --- Allocate Balance to Goals by Priority ---
	$effect(() => {
		let remaining = currentBalance;
		allocations = goals
			.slice()
			.sort((a, b) => a.priority - b.priority)
			.map((g) => {
				const allocated = Math.min(g.amount, Math.max(0, remaining));
				remaining -= allocated;
				return { ...g, allocated };
			});
	});

	// --- Remaining Balance after Saving Goals ---
	let remainingBalance = $derived.by(() => {
		if (!allocations.length) return currentBalance;
		return allocations.reduce((rem, g) => rem - g.allocated, currentBalance);
	});

	// --- Calculate Current Balance from CSV ---
	let currentBalance = $derived.by(() => {
		if (table.length < 2) return 0;
		const amountIdx = table[0].findIndex((h) => h.trim().toLowerCase() === 'amount');
		const typeIdx = table[0].findIndex((h) => h.trim().toLowerCase() === 'type');
		if (amountIdx === -1 || typeIdx === -1) return 0;
		return table.slice(1).reduce((sum, row) => {
			const amt = parseFloat(row[amountIdx]);
			const type = row[typeIdx].trim().toLowerCase();
			if (isNaN(amt)) return sum;
			// Assume 'credit' increases, 'debit' decreases
			return sum + (type === 'credit' ? amt : type === 'debit' ? -amt : 0);
		}, 0);
	});
</script>

<!-- =========================
             Balance Display Section
        ========================= -->
<div class="mb-4 mt-8 flex flex-wrap items-center gap-6 text-lg font-semibold">
	<div>
		Current Balance: <span class="text-primary"
			>{currentBalance.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			})}</span
		>
	</div>
	<div>
		Remaining Balance: <span class="text-secondary"
			>{remainingBalance.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			})}</span
		>
	</div>
</div>

<div class="mb-6">
	<h3 class="mb-2 text-xl font-bold">Saving Goals</h3>
	<form class="mb-4 flex flex-wrap gap-2" onsubmit={addGoal}>
		<input
			type="text"
			placeholder="Goal name"
			class="input input-bordered"
			bind:value={newGoalName}
			required
		/>
		<input
			type="number"
			placeholder="Amount"
			class="input input-bordered"
			bind:value={newGoalAmount}
			min="1"
			step="any"
			required
		/>
		<button type="submit" class="btn btn-primary">Add Goal</button>
	</form>

	{#if allocations.length > 0}
		<table class="mb-4 table w-full">
			<thead>
				<tr>
					<th>Priority</th>
					<th>Name</th>
					<th>Target Amount</th>
					<th>Allocated</th>
					<th>Progress</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each allocations as goal, idx (goal.id)}
					<tr>
						<td>
							<button
								class="btn btn-xs"
								onclick={() => changePriority(goal.id, 'up')}
								disabled={idx === 0}>↑</button
							>
							<button
								class="btn btn-xs"
								onclick={() => changePriority(goal.id, 'down')}
								disabled={idx === allocations.length - 1}>↓</button
							>
						</td>
						<td>
							<input
								type="text"
								class="input input-bordered input-xs"
								bind:value={goal.name}
								onchange={(e) => updateGoal(goal.id, 'name', (e.target as HTMLInputElement).value)}
							/>
						</td>
						<td>
							<input
								type="number"
								class="input input-bordered input-xs"
								bind:value={goal.amount}
								min="1"
								step="any"
								onchange={(e) =>
									updateGoal(goal.id, 'amount', (e.target as HTMLInputElement).value)}
							/>
						</td>
						<td>
							{goal.allocated.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</td>
						<td>
							<div class="bg-base-200 h-4 w-32 overflow-hidden rounded-full">
								<div
									class="bg-primary h-4"
									style="width: {Math.min(100, (goal.allocated / goal.amount) * 100)}%"
								></div>
							</div>
							<span class="ml-2 text-xs"
								>{Math.min(100, (goal.allocated / goal.amount) * 100).toFixed(1)}%</span
							>
						</td>
						<td>
							<button class="btn btn-xs btn-error" onclick={() => removeGoal(goal.id)}
								>Remove</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="text-base-content/70">No saving goals yet.</p>
	{/if}
</div>
