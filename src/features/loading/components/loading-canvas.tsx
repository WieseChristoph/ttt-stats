'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import styles from './loading-screen.module.css';

type CanvasMetricsType = {
    width: number;
    height: number;
    scale: number;
};

const baseCanvasHeight = 1080;

const initialMetrics: CanvasMetricsType = {
    width: 1920,
    height: baseCanvasHeight,
    scale: 1,
};

function getCanvasMetrics(): CanvasMetricsType {
    const scale = window.innerHeight / baseCanvasHeight;

    return {
        width: window.innerWidth / scale,
        height: baseCanvasHeight,
        scale,
    };
}

export function LoadingCanvas({ children }: { children: ReactNode }) {
    const [metrics, setMetrics] = useState(initialMetrics);

    useEffect(() => {
        const updateMetrics = () => setMetrics(getCanvasMetrics());

        updateMetrics();
        window.addEventListener('resize', updateMetrics);

        return () => window.removeEventListener('resize', updateMetrics);
    }, []);

    return (
        <div
            className={styles.canvas}
            style={{
                width: metrics.width,
                height: metrics.height,
                transform: `scale(${metrics.scale})`,
                transformOrigin: 'top left',
            }}
        >
            {children}
        </div>
    );
}
