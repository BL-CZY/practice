// src/routes/api/upload-csv/+page.server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { v4 as uuidv4 } from 'uuid';
import { allData, type CategorySpending } from '$lib/server/backend';

// Expected CSV fields
const EXPECTED_FIELDS = ['', 'date', 'description', 'amount', 'type', 'account_number', 'currency'];

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the CSV data and category spending from the request
		const formData = await request.formData();
		const csvFile = formData.get('csv') as string;
		const categorySpendingJson = formData.get('categorySpending') as string;

		if (!csvFile) {
			return json({ error: 'No CSV file provided' }, { status: 400 });
		}

		if (!categorySpendingJson) {
			return json({ error: 'No category spending data provided' }, { status: 400 });
		}

		// Parse category spending data
		let categorySpending: CategorySpending[];
		try {
			categorySpending = JSON.parse(categorySpendingJson);
		} catch (error) {
			return json({ error: 'Invalid category spending JSON format' }, { status: 400 });
		}

		// Validate category spending structure
		const categoryValidationResult = validateCategorySpending(categorySpending);
		if (!categoryValidationResult.isValid) {
			return json({ error: categoryValidationResult.error }, { status: 400 });
		}

		// Parse CSV into string[][]
		const parsedData = parseCSV(csvFile);

		if (parsedData.length === 0) {
			return json({ error: 'Empty CSV file' }, { status: 400 });
		}

		// Validate CSV structure
		const validationResult = validateCSVStructure(parsedData);
		if (!validationResult.isValid) {
			return json({ error: validationResult.error }, { status: 400 });
		}

		// Generate UUID and store the data
		const uuid = uuidv4();
		allData.set(uuid, {
			csvData: parsedData,
			categorySpending: categorySpending
		});

		return json({
			uuid,
			message: 'CSV data and category spending uploaded successfully',
			csvRowCount: parsedData.length,
			categoryCount: categorySpending.length
		});
	} catch (error) {
		console.error('Error processing CSV:', error);
		return json({ error: 'Failed to process CSV file' }, { status: 500 });
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

function parseCSV(csvContent: string): string[][] {
	const lines = csvContent.trim().split('\n');
	const result: string[][] = [];

	for (const line of lines) {
		// Simple CSV parsing - handles basic cases
		// For production, consider using a proper CSV parser library
		const row = line.split(',').map((field) => field.trim());
		result.push(row);
	}

	return result;
}

function validateCSVStructure(data: string[][]): { isValid: boolean; error?: string } {
	if (data.length === 0) {
		return { isValid: false, error: 'CSV is empty' };
	}

	// Check header row
	const header = data[0];
	if (header.length !== EXPECTED_FIELDS.length) {
		return {
			isValid: false,
			error: `Expected ${EXPECTED_FIELDS.length} columns, got ${header.length}`
		};
	}

	// Validate header fields
	for (let i = 0; i < EXPECTED_FIELDS.length; i++) {
		if (header[i] !== EXPECTED_FIELDS[i]) {
			return {
				isValid: false,
				error: `Expected column ${i} to be '${EXPECTED_FIELDS[i]}', got '${header[i]}'`
			};
		}
	}

	// Validate data rows have correct number of columns
	for (let i = 1; i < data.length; i++) {
		if (data[i].length !== EXPECTED_FIELDS.length) {
			return {
				isValid: false,
				error: `Row ${i} has ${data[i].length} columns, expected ${EXPECTED_FIELDS.length}`
			};
		}
	}

	return { isValid: true };
}
