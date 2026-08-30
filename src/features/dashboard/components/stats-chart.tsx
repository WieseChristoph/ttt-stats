'use client';

import { Chart, type ChartConfiguration, registerables } from 'chart.js';
import { useEffect, useRef } from 'react';

Chart.register(...registerables);

type StatsChartPropsType = {
    type: 'bar' | 'line';
    labels: string[];
    datasets: ChartDatasetType[];
    height?: number;
};

type ChartDatasetType = {
    label: string;
    values: number[];
    colors?: string[];
};

export function StatsChart({ type, labels, datasets, height = 260 }: StatsChartPropsType) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        chartRef.current?.destroy();

        const config: ChartConfiguration = {
            type,
            data: {
                labels,
                datasets: datasets.map((dataset) => ({
                    label: dataset.label,
                    data: dataset.values,
                    backgroundColor: dataset.colors ?? 'rgba(157, 140, 255, .65)',
                    borderColor: dataset.colors ?? '#9d8cff',
                    borderWidth: 2,
                    borderRadius: 8,
                    tension: 0.35,
                    fill: type === 'line',
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: datasets.length > 1,
                        labels: { color: '#aeb8c6', usePointStyle: true },
                    },
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#8490a0' } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,.07)' },
                        ticks: { color: '#8490a0' },
                    },
                },
            },
        };

        chartRef.current = new Chart(canvasRef.current, config);

        return () => chartRef.current?.destroy();
    }, [datasets, labels, type]);

    return (
        <div
            className="relative w-full"
            style={{ height }}
        >
            <canvas ref={canvasRef} />
        </div>
    );
}
