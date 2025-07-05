// src/routes/api/upload-csv/+page.server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { allData, type CategorySpending, type StoredData } from '$lib/server/backend';

// Budget analysis types
interface BudgetAnalysis {
	category: string;
	budgetAmount: number;
	actualSpending: number;
	difference: number;
	isOverBudget: boolean;
}

interface SavingsAnalysis {
	monthlyIncome: number;
	totalSpending: number;
	currentMonthlySavings: number;
	projectedMonthlySavings: number;
	savingsRate: number;
	recommendations: string[];
}

interface BudgetReport {
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

// Expected CSV fields
const EXPECTED_FIELDS = ['', 'date', 'description', 'amount', 'type', 'account_number', 'currency'];

// All possible spending categories
const SPENDING_CATEGORIES = [
	'Rent',
	'Groceries',
	'Utilities',
	'Entertainment',
	'Transportation',
	'Dining Out',
	'Shopping',
	'Health',
	'Travel',
	'Other'
];

// Budget allocation percentages (recommended financial planning ratios)
const BUDGET_ALLOCATIONS = {
	Rent: 0.3, // 30% of income
	Groceries: 0.12, // 12% of income
	Utilities: 0.08, // 8% of income
	Entertainment: 0.05, // 5% of income
	Transportation: 0.15, // 15% of income
	'Dining Out': 0.06, // 6% of income
	Shopping: 0.05, // 5% of income
	Health: 0.05, // 5% of income
	Travel: 0.04, // 4% of income
	Other: 0.1 // 10% of income
};

// GET request for budget analysis
export const GET: RequestHandler = async ({ url }) => {
	try {
		const uuid = url.searchParams.get('uuid');

		if (!uuid) {
			return json({ error: 'UUID parameter is required' }, { status: 400 });
		}

		const storedData = allData.get(uuid);
		if (!storedData) {
			return json({ error: 'No data found for the provided UUID' }, { status: 404 });
		}

		// Analyze the transaction data
		const budgetReport = analyzeBudget(uuid, storedData);

		allData.delete(uuid); // Clean up data after analysis

		return json(budgetReport);
	} catch (error) {
		console.error('Error analyzing budget:', error);
		return json({ error: 'Failed to analyze budget' }, { status: 500 });
	}
};

function validateCategorySpending(categorySpending: any[]): { isValid: boolean; error?: string } {
	if (!Array.isArray(categorySpending)) {
		return { isValid: false, error: 'Category spending must be an array' };
	}

	if (categorySpending.length === 0) {
		return { isValid: false, error: 'Category spending array cannot be empty' };
	}

	for (let i = 0; i < categorySpending.length; i++) {
		const item = categorySpending[i];

		if (!item || typeof item !== 'object') {
			return { isValid: false, error: `Category spending item ${i} must be an object` };
		}

		if (!item.hasOwnProperty('category') || typeof item.category !== 'string') {
			return {
				isValid: false,
				error: `Category spending item ${i} must have a 'category' string property`
			};
		}

		if (!item.hasOwnProperty('sum') || typeof item.sum !== 'number') {
			return {
				isValid: false,
				error: `Category spending item ${i} must have a 'sum' number property`
			};
		}

		if (item.category.trim() === '') {
			return { isValid: false, error: `Category spending item ${i} category cannot be empty` };
		}
	}

	return { isValid: true };
}

function analyzeBudget(uuid: string, storedData: StoredData): BudgetReport {
	const { csvData, categorySpending } = storedData;

	// Extract transaction data (skip header row)
	const transactions = csvData.slice(1);

	// Calculate income and date range
	const incomeData = calculateIncome(transactions);
	const dateRange = calculateDateRange(transactions);

	// Calculate monthly budget allocations
	const monthlyIncome = incomeData.totalIncome / dateRange.monthsAnalyzed;
	const budgetAnalysis = calculateBudgetAnalysis(categorySpending, monthlyIncome);

	// Calculate savings analysis
	const savingsAnalysis = calculateSavingsAnalysis(
		incomeData,
		categorySpending,
		dateRange.monthsAnalyzed
	);

	return {
		uuid,
		analysisDate: new Date().toISOString(),
		totalIncome: incomeData.totalIncome,
		totalSpending: categorySpending.reduce((sum, cat) => sum + cat.sum, 0),
		budgetAnalysis,
		savingsAnalysis,
		timeframe: {
			startDate: dateRange.startDate,
			endDate: dateRange.endDate,
			monthsAnalyzed: dateRange.monthsAnalyzed
		}
	};
}

function calculateIncome(transactions: string[][]): {
	totalIncome: number;
	creditTransactions: number;
} {
	let totalIncome = 0;
	let creditTransactions = 0;

	for (const transaction of transactions) {
		const amount = parseFloat(transaction[3]); // amount column
		const type = transaction[4]; // type column

		if (type === 'credit' && amount > 0) {
			totalIncome += amount;
			creditTransactions++;
		}
	}

	return { totalIncome, creditTransactions };
}

function calculateDateRange(transactions: string[][]): {
	startDate: string;
	endDate: string;
	monthsAnalyzed: number;
} {
	const dates = transactions.map((t) => new Date(t[1])).sort((a, b) => a.getTime() - b.getTime());
	const startDate = dates[0];
	const endDate = dates[dates.length - 1];

	// Calculate months between dates
	const monthsAnalyzed = Math.max(
		1,
		(endDate.getFullYear() - startDate.getFullYear()) * 12 +
			(endDate.getMonth() - startDate.getMonth()) +
			1
	);

	return {
		startDate: startDate.toISOString().split('T')[0],
		endDate: endDate.toISOString().split('T')[0],
		monthsAnalyzed
	};
}

function calculateBudgetAnalysis(
	categorySpending: CategorySpending[],
	monthlyIncome: number
): BudgetAnalysis[] {
	const analysis: BudgetAnalysis[] = [];

	// Create a map of actual spending by category
	const spendingMap = new Map<string, number>();
	categorySpending.forEach((cat) => {
		spendingMap.set(cat.category, cat.sum);
	});

	// Analyze each category
	SPENDING_CATEGORIES.forEach((category) => {
		const budgetAmount =
			monthlyIncome * BUDGET_ALLOCATIONS[category as keyof typeof BUDGET_ALLOCATIONS] || 0;
		const actualSpending = spendingMap.get(category) || 0;
		const difference = actualSpending - budgetAmount;

		analysis.push({
			category,
			budgetAmount: Math.round(budgetAmount * 100) / 100,
			actualSpending,
			difference: Math.round(difference * 100) / 100,
			isOverBudget: difference > 0
		});
	});

	return analysis;
}

function calculateSavingsAnalysis(
	incomeData: { totalIncome: number; creditTransactions: number },
	categorySpending: CategorySpending[],
	monthsAnalyzed: number
): SavingsAnalysis {
	const monthlyIncome = incomeData.totalIncome / monthsAnalyzed;
	const totalSpending = categorySpending.reduce((sum, cat) => sum + cat.sum, 0);
	const monthlySpending = totalSpending / monthsAnalyzed;
	const currentMonthlySavings = monthlyIncome - monthlySpending;

	// Calculate recommended budget total (should be 90% of income, leaving 10% for savings)
	const recommendedSpending = monthlyIncome * 0.9;
	const projectedMonthlySavings = monthlyIncome - recommendedSpending;

	const savingsRate = (currentMonthlySavings / monthlyIncome) * 100;

	// Generate recommendations
	const recommendations = generateSavingsRecommendations(
		currentMonthlySavings,
		projectedMonthlySavings,
		savingsRate
	);

	return {
		monthlyIncome: Math.round(monthlyIncome * 100) / 100,
		totalSpending: Math.round(monthlySpending * 100) / 100,
		currentMonthlySavings: Math.round(currentMonthlySavings * 100) / 100,
		projectedMonthlySavings: Math.round(projectedMonthlySavings * 100) / 100,
		savingsRate: Math.round(savingsRate * 100) / 100,
		recommendations
	};
}

function generateSavingsRecommendations(
	currentSavings: number,
	projectedSavings: number,
	savingsRate: number
): string[] {
	const recommendations: string[] = [];

	if (currentSavings < 0) {
		recommendations.push(
			"You're spending more than you earn. Consider reducing expenses immediately."
		);
		recommendations.push(
			'Focus on cutting non-essential spending like dining out and entertainment.'
		);
	} else if (savingsRate < 10) {
		recommendations.push('Try to save at least 10% of your income for emergency fund.');
		recommendations.push('Consider reducing discretionary spending to increase savings.');
	} else if (savingsRate < 20) {
		recommendations.push(
			'Good savings rate! Consider increasing to 20% for better financial security.'
		);
		recommendations.push('Look for additional income sources or investment opportunities.');
	} else {
		recommendations.push("Excellent savings rate! You're on track for financial independence.");
		recommendations.push('Consider investing surplus savings for long-term wealth building.');
	}

	if (projectedSavings > currentSavings) {
		const additionalSavings = projectedSavings - currentSavings;
		recommendations.push(
			`You could potentially save an additional €${additionalSavings.toFixed(2)} per month by following recommended budget allocations.`
		);
	}

	return recommendations;
}
