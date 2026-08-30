import { MapBrowser } from '@/features/maps/components/map-browser';
import { getMapCards } from '@/features/maps/map-data';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function MapsPage() {
    const maps = await getMapCards();

    return (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <h1 className="mb-8! font-black text-3xl text-white tracking-tight">Maps</h1>
            <MapBrowser maps={maps} />
        </div>
    );
}
