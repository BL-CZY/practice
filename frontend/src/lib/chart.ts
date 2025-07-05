import { Chart } from 'chart.js/auto';

let chartObjects: Map<string, Chart> = new Map();

export function trend(
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
