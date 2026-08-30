import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { getDashboardData } from '@/features/dashboard/dashboard-data';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

const dayInMilliseconds = 86_400_000;

function parseDate(value: string | undefined, fallback: Date, endOfDay: boolean) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return fallback;
    }

    const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);

    return Number.isNaN(date.getTime()) ? fallback : date;
}

function getDates(searchParams: Record<string, string | undefined>) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * dayInMilliseconds);
    defaultFrom.setUTCHours(0, 0, 0, 0);
    const from = parseDate(searchParams.from, defaultFrom, false);
    const to = parseDate(searchParams.to, now, true);

    return from <= to ? { from, to } : { from: defaultFrom, to: now };
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const range = getDates(await searchParams);
    const dashboard = await getDashboardData(range);

    return (
        <DashboardOverview
            dashboard={dashboard}
            from={range.from.toISOString().slice(0, 10)}
            to={range.to.toISOString().slice(0, 10)}
        />
    );
}
