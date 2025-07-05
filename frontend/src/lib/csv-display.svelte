<script lang="ts">
	const { table }: { table: string[][] } = $props();

	// --- Table Sorting State ---
	let sortFieldIdx: number | null = $state(null);
	let sortAsc = $state(true);

	function sortByField(idx: number) {
		if (sortFieldIdx === idx) {
			sortAsc = !sortAsc;
		} else {
			sortFieldIdx = idx;
			sortAsc = true;
		}
	}

	// --- Table Sorting Logic ---
	let sortedRows = $derived.by(() => {
		if (!table || table.length < 2) return [];
		if (sortFieldIdx === null) return table.slice(1);
		return [...table.slice(1)].sort((a, b) => {
			const aVal = a[sortFieldIdx ?? 0] ?? '';
			const bVal = b[sortFieldIdx ?? 0] ?? '';
			// Try numeric sort if possible
			const aNum = parseFloat(aVal);
			const bNum = parseFloat(bVal);
			if (!isNaN(aNum) && !isNaN(bNum)) {
				return sortAsc ? aNum - bNum : bNum - aNum;
			}
			// Fallback to string sort
			return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		});
	});
</script>

<div class="mt-6 overflow-x-auto">
	<table class="table-zebra table w-full">
		<thead>
			<tr>
				{#each table[0] as header, idx}
					<th class="cursor-pointer select-none" onclick={() => sortByField(idx)}>
						{header}
						{#if sortFieldIdx === idx}
							<span>{sortAsc ? ' ▲' : ' ▼'}</span>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedRows as row}
				<tr>
					{#each row as cell}
						<td>{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
