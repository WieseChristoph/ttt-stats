'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

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
            className="absolute top-0 left-0 grid grid-rows-[42px_minmax(0,1fr)] gap-3 p-3 sm:p-4 xl:gap-4 xl:p-6 [@media(max-height:760px)]:p-3"
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
