// types.ts - Define the types for the API responses
export interface CategorySpending {
	category: string;
	sum: number;
}

export interface UploadResponse {
	uuid: string;
	message: string;
	csvRowCount: number;
	categoryCount: number;
}

export interface BudgetAnalysis {
	category: string;
	budgetAmount: number;
	actualSpending: number;
	difference: number;
	isOverBudget: boolean;
}

export interface SavingsAnalysis {
	monthlyIncome: number;
	totalSpending: number;
	currentMonthlySavings: number;
	projectedMonthlySavings: number;
	savingsRate: number;
	recommendations: string[];
}

export interface BudgetReport {
	uuid: string;
	analysisDate: string;
	totalIncome: number;
	totalSpending: number;
	budgetAnalysis: BudgetAnalysis[];
	savingsAnalysis: SavingsAnalysis;
	timeframe: {
		startDate: string;
		endDate: string;
		monthsAnalyzed: number;
	};
}

interface ApiError {
	error: string;
	details?: string;
}

// API Response types
export type UploadResult =
	| {
			success: true;
			data: UploadResponse;
	  }
	| {
			success: false;
			error: string;
			statusCode: number;
	  };

export type BudgetAnalysisResult =
	| {
			success: true;
			data: BudgetReport;
	  }
	| {
			success: false;
			error: string;
			statusCode: number;
	  };

/**
 * Uploads CSV file and category spending data to the server
 * @param csvFile - The CSV file to upload
 * @param categorySpending - Array of category spending data
 * @returns Promise with upload result
 */
export async function uploadCSVWithCategories(
	csvFile: string,
	categorySpending: CategorySpending[]
): Promise<UploadResult> {
	try {
		// Validate inputs
		if (!csvFile) {
			return {
				success: false,
				error: 'CSV file is required',
				statusCode: 400
			};
		}

		if (!categorySpending || !Array.isArray(categorySpending) || categorySpending.length === 0) {
			return {
				success: false,
				error: 'Category spending data is required and must be a non-empty array',
				statusCode: 400
			};
		}

		// Validate category spending structure
		for (let i = 0; i < categorySpending.length; i++) {
			const item = categorySpending[i];
			if (!item.category || typeof item.category !== 'string') {
				return {
					success: false,
					error: `Category spending item ${i} must have a valid category string`,
					statusCode: 400
				};
			}
			if (typeof item.sum !== 'number' || isNaN(item.sum)) {
				return {
					success: false,
					error: `Category spending item ${i} must have a valid sum number`,
					statusCode: 400
				};
			}
		}

		// Create FormData
		const formData = new FormData();
		formData.append('csv', csvFile);
		formData.append('categorySpending', JSON.stringify(categorySpending));

		// Make the API request
		const response = await fetch('/api/post-data', {
			method: 'POST',
			body: formData
		});

		// Handle response
		if (!response.ok) {
			const errorData: ApiError = await response.json().catch(() => ({
				error: 'Failed to parse error response'
			}));

			return {
				success: false,
				error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
				statusCode: response.status
			};
		}

		const data: UploadResponse = await response.json();

		// Validate response structure
		if (!data.uuid) {
			return {
				success: false,
				error: 'Invalid response: missing UUID',
				statusCode: 500
			};
		}

		return {
			success: true,
			data
		};
	} catch (error) {
		console.error('Error uploading CSV:', error);

		// Handle different types of errors
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return {
				success: false,
				error: 'Network error: Unable to connect to server',
				statusCode: 0
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'An unexpected error occurred',
			statusCode: 500
		};
	}
}

/**
 * Alternative function for uploading CSV data as string
 * @param csvData - The CSV data as a string
 * @param categorySpending - Array of category spending data
 * @returns Promise with upload result
 */
export async function uploadCSVString(
	csvData: string,
	categorySpending: CategorySpending[]
): Promise<UploadResult> {
	try {
		// Validate inputs
		if (!csvData || typeof csvData !== 'string') {
			return {
				success: false,
				error: 'CSV data is required and must be a string',
				statusCode: 400
			};
		}

		if (!categorySpending || !Array.isArray(categorySpending) || categorySpending.length === 0) {
			return {
				success: false,
				error: 'Category spending data is required and must be a non-empty array',
				statusCode: 400
			};
		}

		// Make the API request
		const response = await fetch('/api/post-data', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				csvData,
				categorySpending
			})
		});

		// Handle response
		if (!response.ok) {
			const errorData: ApiError = await response.json().catch(() => ({
				error: 'Failed to parse error response'
			}));

			return {
				success: false,
				error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
				statusCode: response.status
			};
		}

		const data: UploadResponse = await response.json();

		if (!data.uuid) {
			return {
				success: false,
				error: 'Invalid response: missing UUID',
				statusCode: 500
			};
		}

		return {
			success: true,
			data
		};
	} catch (error) {
		console.error('Error uploading CSV string:', error);

		if (error instanceof TypeError && error.message.includes('fetch')) {
			return {
				success: false,
				error: 'Network error: Unable to connect to server',
				statusCode: 0
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'An unexpected error occurred',
			statusCode: 500
		};
	}
}

/**
 * Retrieves budget analysis for uploaded data
 * @param uuid - The UUID returned from the upload function
 * @returns Promise with budget analysis result
 */
export async function getBudgetAnalysis(uuid: string): Promise<BudgetAnalysisResult> {
	try {
		// Validate input
		if (!uuid || typeof uuid !== 'string') {
			return {
				success: false,
				error: 'UUID is required and must be a string',
				statusCode: 400
			};
		}

		// Validate UUID format (basic check)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(uuid)) {
			return {
				success: false,
				error: 'Invalid UUID format',
				statusCode: 400
			};
		}

		// Make the API request
		const response = await fetch(`/api/get-feedback?uuid=${encodeURIComponent(uuid)}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		});

		// Handle response
		if (!response.ok) {
			const errorData: ApiError = await response.json().catch(() => ({
				error: 'Failed to parse error response'
			}));

			return {
				success: false,
				error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
				statusCode: response.status
			};
		}

		const data: BudgetReport = await response.json();

		// Validate response structure
		if (!data.uuid || !data.budgetAnalysis || !data.savingsAnalysis) {
			return {
				success: false,
				error: 'Invalid response: missing required fields',
				statusCode: 500
			};
		}

		return {
			success: true,
			data
		};
	} catch (error) {
		console.error('Error getting budget analysis:', error);

		if (error instanceof TypeError && error.message.includes('fetch')) {
			return {
				success: false,
				error: 'Network error: Unable to connect to server',
				statusCode: 0
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'An unexpected error occurred',
			statusCode: 500
		};
	}
}

/**
 * Complete workflow: Upload CSV and get budget analysis
 * @param csvFile - The CSV file to upload
 * @param categorySpending - Array of category spending data
 * @returns Promise with budget analysis result
 */
export async function uploadAndAnalyze(
	csvFile: string,
	categorySpending: CategorySpending[]
): Promise<BudgetAnalysisResult> {
	try {
		// Step 1: Upload the CSV
		const uploadResult = await uploadCSVWithCategories(csvFile, categorySpending);

		if (!uploadResult.success) {
			return {
				success: false,
				error: `Upload failed: ${uploadResult.error}`,
				statusCode: uploadResult.statusCode
			};
		}

		// Step 2: Get budget analysis
		const analysisResult = await getBudgetAnalysis(uploadResult.data.uuid);

		if (!analysisResult.success) {
			return {
				success: false,
				error: `Analysis failed: ${analysisResult.error}`,
				statusCode: analysisResult.statusCode
			};
		}

		console.log(analysisResult);
		return analysisResult;
	} catch (error) {
		console.error('Error in upload and analyze workflow:', error);

		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'An unexpected error occurred in the workflow',
			statusCode: 500
		};
	}
}

// Usage examples and utility functions

/**
 * Helper function to format currency values
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
	return new Intl.NumberFormat('en-MT', {
		style: 'currency',
		currency: currency
	}).format(amount);
}

/**
 * Helper function to get over-budget categories
 */
export function getOverBudgetCategories(budgetAnalysis: BudgetAnalysis[]): BudgetAnalysis[] {
	return budgetAnalysis.filter((item) => item.isOverBudget);
}

/**
 * Helper function to calculate total budget vs actual spending
 */
export function getTotalBudgetComparison(budgetAnalysis: BudgetAnalysis[]): {
	totalBudget: number;
	totalActual: number;
	totalDifference: number;
	isOverBudget: boolean;
} {
	const totalBudget = budgetAnalysis.reduce((sum, item) => sum + item.budgetAmount, 0);
	const totalActual = budgetAnalysis.reduce((sum, item) => sum + item.actualSpending, 0);
	const totalDifference = totalActual - totalBudget;

	return {
		totalBudget,
		totalActual,
		totalDifference,
		isOverBudget: totalDifference > 0
	};
}
