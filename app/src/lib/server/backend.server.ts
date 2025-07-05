// Types for stored data
interface CategorySpending {
	category: string;
	sum: number;
}

interface StoredData {
	csvData: string[][];
	categorySpending: CategorySpending[];
}

// Global map to store parsed CSV data and category spending
let allData = new Map<string, StoredData>();
