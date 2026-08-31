'use client';

import { Chart, type ChartConfiguration, registerables } from 'chart.js';
import { useEffect, useRef } from 'react';

Chart.register(...registerables);

export type StatsChartPropsType = {
    type: 'bar' | 'line';
    labels: string[];
    datasets: ChartDatasetType[];
    height?: number;
    stacked?: boolean;
    horizontal?: boolean;
    valueFormat?: 'number' | 'percentage' | 'duration';
    fill?: boolean | 'origin' | 'stack' | '-1';
};

export type ChartDatasetType = {
    label: string;
    values: Array<number | null>;
    colors?: string[];
    stepped?: boolean;
    fill?: boolean | 'origin' | 'stack' | '-1';
    axis?: 'primary' | 'secondary';
    order?: number;
    tooltipValues?: Array<number | null>;
    pointRadius?: number;
};

function formatValue(value: number, format: NonNullable<StatsChartPropsType['valueFormat']>) {
    if (format === 'percentage') {
        return `${Math.round(value)}%`;
    }

    if (format === 'duration') {
        const minutes = Math.floor(value / 60);
        return `${minutes}:${String(Math.round(value % 60)).padStart(2, '0')}`;
    }

    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

export function StatsChart({
    type,
    labels,
    datasets,
    height = 260,
    stacked = false,
    horizontal = false,
    valueFormat = 'number',
    fill = true,
}: StatsChartPropsType) {
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
                    borderRadius: type === 'bar' && stacked ? 0 : 8,
                    tension: dataset.stepped ? 0 : 0.35,
                    fill: type === 'line' && fill !== false ? (dataset.fill ?? fill) : false,
                    // The timeline values represent the state *after* each event.
                    // Chart.js' `before` mode keeps the previous value up to the
                    // current point, then changes at that point. Using `after`
                    // would draw the transition at the preceding point, making
                    // an event at 20s appear at 0:00.
                    stepped: dataset.stepped ? 'before' : false,
                    spanGaps: false,
                    yAxisID: dataset.axis === 'secondary' ? 'y1' : 'y',
                    order: dataset.order,
                    tooltipValues: dataset.tooltipValues,
                    pointRadius: dataset.pointRadius ?? (type === 'line' && dataset.fill ? 0 : 3),
                    pointHoverRadius: 4,
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: horizontal ? 'y' : 'x',
                plugins: {
                    legend: {
                        display: datasets.length > 1,
                        labels: { color: '#aeb8c6', usePointStyle: true },
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const tooltipValues = (
                                    context.dataset as typeof context.dataset & {
                                        tooltipValues?: Array<number | null>;
                                    }
                                ).tooltipValues;
                                const value = Number(tooltipValues?.[context.dataIndex] ?? context.raw);
                                return `${context.dataset.label}: ${formatValue(value, valueFormat)}`;
                            },
                        },
                    },
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: { stacked, grid: { display: false }, ticks: { color: '#8490a0' } },
                    y: {
                        stacked,
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,.07)' },
                        ticks: { color: '#8490a0' },
                    },
                    ...(datasets.some((dataset) => dataset.axis === 'secondary')
                        ? {
                              y1: {
                                  beginAtZero: true,
                                  position: 'right',
                                  grid: { drawOnChartArea: false },
                                  ticks: { color: '#8490a0' },
                              },
                          }
                        : {}),
                },
            },
        };

        chartRef.current = new Chart(canvasRef.current, config);

        return () => chartRef.current?.destroy();
    }, [datasets, fill, horizontal, labels, stacked, type, valueFormat]);

    return (
        <div
            className="relative w-full"
            style={{ height }}
        >
            <canvas ref={canvasRef} />
        </div>
    );
}
