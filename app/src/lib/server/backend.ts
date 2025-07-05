// Types for stored data
export interface CategorySpending {
	category: string;
	sum: number;
}

export interface StoredData {
	csvData: string[][];
	categorySpending: CategorySpending[];
}

// Global map to store parsed CSV data and category spending
export let allData = new Map<string, StoredData>();
