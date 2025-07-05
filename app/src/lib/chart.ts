import { Chart } from 'chart.js/auto';

export class ChartCreator {
	private chartObjects: Map<string, Chart> = new Map();

	// Create or update a chart instance
	private setupChart(node: HTMLCanvasElement, chartConfig: any): void {
		const existingChart = this.chartObjects.get(chartConfig.id);
		if (existingChart) {
			existingChart.destroy();
		}

		const newChart = new Chart(node, {
			type: chartConfig.type,
			data: chartConfig.data,
			options: chartConfig.options || this.getDefaultOptions(chartConfig.type)
		});

		this.chartObjects.set(chartConfig.id, newChart);
	}

	// Default options for different chart types
	private getDefaultOptions(type: string) {
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

	// Svelte action for trend charts
	trend(
		node: HTMLCanvasElement,
		config: { type: string; data: any; id: string; options?: any }
	): { update: (config: any) => void; destroy: () => void } {
		this.setupChart(node, config);

		return {
			update: (newConfig) => {
				this.setupChart(node, newConfig);
			},
			destroy: () => {
				const chart = this.chartObjects.get(config.id);
				if (chart) {
					chart.destroy();
					this.chartObjects.delete(config.id);
				}
			}
		};
	}

	// Svelte action for pie charts
	pie(
		node: HTMLCanvasElement,
		config: { type: string; data: any; id: string; options?: any }
	): { update: (config: any) => void; destroy: () => void } {
		this.setupChart(node, config);

		return {
			update: (newConfig) => {
				this.setupChart(node, newConfig);
			},
			destroy: () => {
				const chart = this.chartObjects.get(config.id);
				if (chart) {
					chart.destroy();
					this.chartObjects.delete(config.id);
				}
			}
		};
	}
}

// Export a singleton instance for use as a Svelte action
export const ChartCreatorInstance = new ChartCreator();
