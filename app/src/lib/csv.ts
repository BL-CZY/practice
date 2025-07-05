const extractCsvData = (csv: string): string[][] => {
	const rows = csv
		.split('\n')
		.map((row) => row.trim())
		.filter((row) => row.length > 0);
	return rows.map((row) => row.split(',').map((cell) => cell.trim()));
};

export default extractCsvData;
