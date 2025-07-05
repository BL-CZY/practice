<script lang="ts">
	import Chart from 'chart.js/auto';

	// Sample data for different chart types
	let barData = [12, 19, 3, 5, 2, 3, 10, 20, 3, 9, 15, 9, 1, 2];
	let lineData = [65, 59, 80, 81, 56, 55, 40, 28, 48, 40, 19, 86, 27, 90];
	let pieData = [300, 50, 100, 200, 150];
	let radarData = [65, 59, 90, 81, 56, 55];
	let doughnutData = [120, 80, 200, 90, 150, 60];
	let polarData = [11, 16, 7, 3, 14, 25];
	let scatterData = [
		{ x: 10, y: 20 },
		{ x: 15, y: 25 },
		{ x: 20, y: 30 },
		{ x: 25, y: 35 },
		{ x: 30, y: 40 },
		{ x: 35, y: 45 },
		{ x: 40, y: 50 }
	];

	let chartObjects: Map<string, Chart> = new Map();

	// Generic chart action for all chart types
	function chart(
		node: HTMLCanvasElement,
		config: { type: string; data: any; id: string; options?: any }
	): { update: (config: any) => void; destroy: () => void } {
		function setupChart(chartConfig: any): void {
			const existingChart = chartObjects.get(chartConfig.id);
			if (existingChart) {
				existingChart.destroy();
			}

			const newChart = new Chart(node, {
				type: chartConfig.type,
				data: chartConfig.data,
				options: chartConfig.options || getDefaultOptions(chartConfig.type)
			});

			chartObjects.set(chartConfig.id, newChart);
		}

		function getDefaultOptions(type: string) {
			const commonOptions = {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top' as const
					}
				}
			};

			switch (type) {
				case 'bar':
				case 'line':
					return {
						...commonOptions,
						scales: {
							y: {
								beginAtZero: true
							}
						}
					};
				case 'radar':
					return {
						...commonOptions,
						scales: {
							r: {
								beginAtZero: true,
								max: 100
							}
						}
					};
				case 'scatter':
					return {
						...commonOptions,
						scales: {
							x: {
								type: 'linear' as const,
								position: 'bottom' as const
							},
							y: {
								beginAtZero: true
							}
						}
					};
				default:
					return commonOptions;
			}
		}

		setupChart(config);

		return {
			update(newConfig) {
				setupChart(newConfig);
			},
			destroy() {
				const chart = chartObjects.get(config.id);
				if (chart) {
					chart.destroy();
					chartObjects.delete(config.id);
				}
			}
		};
	}

	// Data update functions
	function updateBarData() {
		barData = barData.map(() => Math.floor(Math.random() * 50) + 1);
	}

	function updateLineData() {
		lineData = lineData.map(() => Math.floor(Math.random() * 100) + 1);
	}

	function updatePieData() {
		pieData = pieData.map(() => Math.floor(Math.random() * 300) + 50);
	}

	function updateRadarData() {
		radarData = radarData.map(() => Math.floor(Math.random() * 100) + 1);
	}

	function updateDoughnutData() {
		doughnutData = doughnutData.map(() => Math.floor(Math.random() * 200) + 50);
	}

	function updatePolarData() {
		polarData = polarData.map(() => Math.floor(Math.random() * 30) + 1);
	}

	function updateScatterData() {
		scatterData = Array.from({ length: 7 }, () => ({
			x: Math.floor(Math.random() * 50) + 10,
			y: Math.floor(Math.random() * 50) + 10
		}));
	}

	// Calculate linear regression for trendline
	function calculateTrendline(data: { x: number; y: number }[]) {
		const n = data.length;
		const sumX = data.reduce((sum, point) => sum + point.x, 0);
		const sumY = data.reduce((sum, point) => sum + point.y, 0);
		const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
		const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
		const intercept = (sumY - slope * sumX) / n;

		// Generate trendline points
		const minX = Math.min(...data.map((p) => p.x));
		const maxX = Math.max(...data.map((p) => p.x));

		return [
			{ x: minX, y: slope * minX + intercept },
			{ x: maxX, y: slope * maxX + intercept }
		];
	}

	// Chart configurations
	$: barConfig = {
		type: 'bar',
		id: 'bar-chart',
		data: {
			labels: [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec',
				'Q1',
				'Q2'
			],
			datasets: [
				{
					label: 'Sales',
					data: barData,
					backgroundColor: 'rgba(54, 162, 235, 0.6)',
					borderColor: 'rgba(54, 162, 235, 1)',
					borderWidth: 1
				}
			]
		}
	};

	$: lineConfig = {
		type: 'line',
		id: 'line-chart',
		data: {
			labels: [
				'Week 1',
				'Week 2',
				'Week 3',
				'Week 4',
				'Week 5',
				'Week 6',
				'Week 7',
				'Week 8',
				'Week 9',
				'Week 10',
				'Week 11',
				'Week 12',
				'Week 13',
				'Week 14'
			],
			datasets: [
				{
					label: 'Website Traffic',
					data: lineData,
					borderColor: 'rgba(255, 99, 132, 1)',
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					tension: 0.4,
					fill: true
				}
			]
		}
	};

	$: pieConfig = {
		type: 'pie',
		id: 'pie-chart',
		data: {
			labels: ['Desktop', 'Mobile', 'Tablet', 'Smart TV', 'Other'],
			datasets: [
				{
					data: pieData,
					backgroundColor: [
						'rgba(255, 99, 132, 0.8)',
						'rgba(54, 162, 235, 0.8)',
						'rgba(255, 205, 86, 0.8)',
						'rgba(75, 192, 192, 0.8)',
						'rgba(153, 102, 255, 0.8)'
					],
					borderWidth: 2
				}
			]
		}
	};

	$: radarConfig = {
		type: 'radar',
		id: 'radar-chart',
		data: {
			labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
			datasets: [
				{
					label: 'Product A',
					data: radarData,
					borderColor: 'rgba(255, 99, 132, 1)',
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					borderWidth: 2
				}
			]
		}
	};

	$: doughnutConfig = {
		type: 'doughnut',
		id: 'doughnut-chart',
		data: {
			labels: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js'],
			datasets: [
				{
					data: doughnutData,
					backgroundColor: [
						'rgba(255, 99, 132, 0.8)',
						'rgba(54, 162, 235, 0.8)',
						'rgba(255, 205, 86, 0.8)',
						'rgba(75, 192, 192, 0.8)',
						'rgba(153, 102, 255, 0.8)',
						'rgba(255, 159, 64, 0.8)'
					],
					borderWidth: 2
				}
			]
		}
	};

	$: polarConfig = {
		type: 'polarArea',
		id: 'polar-chart',
		data: {
			labels: ['Red', 'Green', 'Yellow', 'Grey', 'Blue', 'Purple'],
			datasets: [
				{
					data: polarData,
					backgroundColor: [
						'rgba(255, 99, 132, 0.6)',
						'rgba(75, 192, 192, 0.6)',
						'rgba(255, 205, 86, 0.6)',
						'rgba(201, 203, 207, 0.6)',
						'rgba(54, 162, 235, 0.6)',
						'rgba(153, 102, 255, 0.6)'
					],
					borderWidth: 2
				}
			]
		}
	};

	$: scatterConfig = {
		type: 'scatter',
		id: 'scatter-chart',
		data: {
			datasets: [
				{
					label: 'Data Points',
					data: scatterData,
					backgroundColor: 'rgba(255, 99, 132, 0.6)',
					borderColor: 'rgba(255, 99, 132, 1)',
					borderWidth: 2
				},
				{
					label: 'Trend Line',
					data: calculateTrendline(scatterData),
					type: 'line',
					borderColor: 'rgba(54, 162, 235, 1)',
					backgroundColor: 'rgba(54, 162, 235, 0.1)',
					borderWidth: 3,
					pointRadius: 0,
					pointHoverRadius: 0,
					showLine: true,
					fill: false
				}
			]
		}
	};
</script>

<div class="bg-base-100 min-h-screen p-6">
	<h1 class="mb-8 text-center text-3xl font-bold">Chart.js with Svelte 5 Demo</h1>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Bar Chart -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Bar Chart</h2>
				<div class="h-64">
					<canvas use:chart={barConfig}></canvas>
				</div>
				<div class="card-actions justify-end">
					<button class="btn btn-primary" onclick={updateBarData}>Update Data</button>
				</div>
			</div>
		</div>

		<!-- Line Chart -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Line Chart</h2>
				<div class="h-64">
					<canvas use:chart={lineConfig}></canvas>
				</div>
				<div class="card-actions justify-end">
					<button class="btn btn-secondary" onclick={updateLineData}>Update Data</button>
				</div>
			</div>
		</div>

		<!-- Pie Chart -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Pie Chart</h2>
				<div class="h-64">
					<canvas use:chart={pieConfig}></canvas>
				</div>
				<div class="card-actions justify-end">
					<button class="btn btn-accent" onclick={updatePieData}>Update Data</button>
				</div>
			</div>
		</div>

		<!-- Radar Chart -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Radar Chart</h2>
				<div class="h-64">
					<canvas use:chart={radarConfig}></canvas>
				</div>
				<div class="card-actions justify-end">
					<button class="btn btn-warning" onclick={updateRadarData}>Update Data</button>
				</div>
			</div>
		</div>

		<!-- Doughnut Chart -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Doughnut Chart</h2>
				<div class="h-64">
					<canvas use:chart={doughnutConfig}></canvas>
				</div>
				<div class="card-actions justify-end">
					<button class="btn btn-info" onclick={updateDoughnutData}>Update Data</button>
				</div>
			</div>
		</div>

		<!-- Polar Area Chart -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Polar Area Chart</h2>
				<div class="h-64">
					<canvas use:chart={polarConfig}></canvas>
				</div>
				<div class="card-actions justify-end">
					<button class="btn btn-success" onclick={updatePolarData}>Update Data</button>
				</div>
			</div>
		</div>

		<!-- Scatter Chart - Full Width -->
		<div class="card bg-base-200 shadow-xl lg:col-span-2">
			<div class="card-body">
				<h2 class="card-title">Scatter Plot</h2>
				<div class="h-64">
					<canvas use:chart={scatterConfig}></canvas>
				</div>
				<div class="card-actions justify-end">
					<button class="btn btn-error" onclick={updateScatterData}>Update Data</button>
				</div>
			</div>
		</div>
	</div>
</div>
