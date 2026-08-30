import { LoadingScreen } from '@/features/loading/components/loading-screen';
import { getLoadingSnapshot } from '@/features/loading/loading-data';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

type LoadingPagePropsType = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getQueryValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function LoadingPage({ searchParams }: LoadingPagePropsType) {
    const query = await searchParams;
    const mapName = getQueryValue(query.mapname)?.trim() || undefined;
    const steamIdValue = getQueryValue(query.steamid)?.trim();
    const steamId = steamIdValue && /^\d{17}$/.test(steamIdValue) ? steamIdValue : undefined;
    const snapshot = await getLoadingSnapshot(mapName, steamId);

    return <LoadingScreen snapshot={snapshot} />;
}
