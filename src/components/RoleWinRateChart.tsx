"use client";

import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";

Chart.register(...registerables);

export function RoleWinRateChart() {
	const chartRef = useRef<HTMLCanvasElement>(null);
	const chartInstance = useRef<Chart | null>(null);

	useEffect(() => {
		if (!chartRef.current) return;

		// Destroy existing chart
		if (chartInstance.current) {
			chartInstance.current.destroy();
		}

		const ctx = chartRef.current.getContext("2d");
		if (!ctx) return;

		// Generate dates for the last 14 days
		const dates = Array.from({ length: 14 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (13 - i));
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});
		});

		// Generate random win rates
		const traitorData = dates.map(() => Math.floor(Math.random() * 40) + 20);
		const innocentData = dates.map(() => Math.floor(Math.random() * 40) + 30);
		const jackalData = dates.map(() => Math.floor(Math.random() * 20) + 5);

		chartInstance.current = new Chart(ctx, {
			type: "line",
			data: {
				labels: dates,
				datasets: [
					{
						label: "Traitor",
						data: traitorData,
						borderColor: "#ef4444",
						backgroundColor: "rgba(239, 68, 68, 0.1)",
						tension: 0.3,
						fill: true,
					},
					{
						label: "Innocent",
						data: innocentData,
						borderColor: "#10b981",
						backgroundColor: "rgba(16, 185, 129, 0.1)",
						tension: 0.3,
						fill: true,
					},
					{
						label: "Jackal",
						data: jackalData,
						borderColor: "#8b5cf6",
						backgroundColor: "rgba(139, 92, 246, 0.1)",
						tension: 0.3,
						fill: true,
					},
				],
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

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, []);

	return <canvas ref={chartRef} />;
}
