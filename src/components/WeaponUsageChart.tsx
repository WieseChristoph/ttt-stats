import { getKillsByInflictor } from "@/actions/deathAction";
import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import type { DateRange } from "react-day-picker";

interface WeaponUsageChartProps {
	dateRange?: DateRange;
}

Chart.register(...registerables);

const colors = [
	"#ef4444",
	"#f59e0b",
	"#10b981",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#eab308",
	"#22c55e",
	"#06b6d4",
	"#6366f1",
	"#d946ef",
];

const noResultsPlugin = {
	id: "noResults",
	afterDraw: (
		chart: Chart<"bar", (number | [number, number] | null)[], unknown>,
	) => {
		const { datasets } = chart.data;
		let hasData = false;

		for (const dataset of datasets) {
			if (dataset.data.length > 0 && dataset.data.some((item) => item !== 0)) {
				hasData = true;
				break;
			}
		}

		if (!hasData) {
			const {
				chartArea: { left, top, right, bottom },
				ctx,
			} = chart;
			const centerX = (left + right) / 2;
			const centerY = (top + bottom) / 2;

			chart.clear();
			ctx.save();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#ffffff";
			ctx.font = "20px sans-serif";
			ctx.fillText("No data to display", centerX, centerY);
			ctx.restore();
		}
	},
};

export function WeaponUsageChart({ dateRange }: WeaponUsageChartProps) {
	const chartRef = useRef<HTMLCanvasElement>(null);
	const chartInstance = useRef<Chart | null>(null);

	useEffect(() => {
		if (dateRange?.from && dateRange.to) {
			getKillsByInflictor(dateRange?.from, dateRange.to, 10).then((results) => {
				const weapons = results.map((result, index) => ({
					name: result.inflictor,
					kills: result.kills,
					color: colors[index],
				}));

				if (!chartRef.current) return;

				if (chartInstance.current) {
					// Destroy existing chart
					chartInstance.current.destroy();
				}

				const ctx = chartRef.current.getContext("2d");
				if (!ctx) return;

				chartInstance.current = new Chart(ctx, {
					type: "bar",
					data: {
						labels: weapons.map((w) => w.name),
						datasets: [
							{
								label: "Kills",
								data: weapons.map((w) => w.kills),
								backgroundColor: weapons.map((w) => w.color),
								borderRadius: 4,
							},
						],
					},
					options: {
						indexAxis: "y",
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								display: false,
							},
							tooltip: {
								backgroundColor: "#27272a",
								borderColor: "#3f3f46",
								titleColor: "#e4e4e7",
								bodyColor: "#e4e4e7",
							},
						},
						scales: {
							x: {
								grid: {
									color: "rgba(63, 63, 70, 0.5)",
								},
								ticks: {
									color: "#a1a1aa",
								},
							},
							y: {
								grid: {
									display: false,
								},
								ticks: {
									color: "#a1a1aa",
								},
							},
						},
					},
					plugins: [noResultsPlugin],
				});
			});
		}

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, [dateRange]);

	return <canvas ref={chartRef} />;
}
