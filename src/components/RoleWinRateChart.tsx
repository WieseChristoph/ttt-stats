"use client";

import { getTeamWinsByDate } from "@/actions/roundAction";
import type { Team } from "@/enums/Team";
import { getTeamColor } from "@/lib/teamMapper";
import { cFirst } from "@/lib/utils";
import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import type { DateRange } from "react-day-picker";

Chart.register(...registerables);

interface RoleWinRateChart {
	dateRange?: DateRange;
}

export function RoleWinRateChart({ dateRange }: RoleWinRateChart) {
	const chartRef = useRef<HTMLCanvasElement>(null);
	const chartInstance = useRef<Chart | null>(null);

	useEffect(() => {
		const renderChart = async () => {
			if (!chartRef.current) return;

			if (chartInstance.current) {
				chartInstance.current.destroy();
			}

			const ctx = chartRef.current.getContext("2d");
			if (!ctx) return;

			const fromDate = dateRange?.from;
			const toDate = dateRange?.to;
			if (!fromDate || !toDate) return;

			const rawData = await getTeamWinsByDate(fromDate, toDate);

			const groupedByDate: Record<string, Record<string, number>> = {};
			const teamsSet = new Set<string>();

			for (const entry of rawData) {
				const date = new Date(entry.date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				});
				if (!groupedByDate[date]) groupedByDate[date] = {};
				groupedByDate[date][entry.team] = Math.round(entry.winRate * 100); // Convert to percentage
				teamsSet.add(entry.team);
			}

			const labels: string[] = [];
			const currentDate = new Date(fromDate);
			while (currentDate <= toDate) {
				labels.push(
					currentDate.toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
					}),
				);
				currentDate.setDate(currentDate.getDate() + 1);
			}

			const datasets = Array.from(teamsSet).map((team) => {
				return {
					label: cFirst(team),
					data: labels.map((date) => groupedByDate[date]?.[team] ?? 0),
					borderColor: getTeamColor(team as Team),
					backgroundColor: `${getTeamColor(team as Team)}1A`,
					tension: 0.3,
					fill: true,
				};
			});

			chartInstance.current = new Chart(ctx, {
				type: "line",
				data: {
					labels,
					datasets,
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: "top",
							labels: {
								color: "#e4e4e7",
							},
						},
						tooltip: {
							backgroundColor: "#27272a",
							borderColor: "#3f3f46",
							titleColor: "#e4e4e7",
							bodyColor: "#e4e4e7",
							callbacks: {
								label: (context) => `${context.dataset.label}: ${context.parsed.y}%`,
							},
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
								color: "rgba(63, 63, 70, 0.5)",
							},
							ticks: {
								color: "#a1a1aa",
							},
							min: 0,
							max: 100,
						},
					},
				},
			});
		};

		renderChart();

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, [dateRange]);

	return <canvas ref={chartRef} className="h-64 w-full" />;
}
