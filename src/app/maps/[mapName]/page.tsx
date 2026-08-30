import { z } from 'zod';
import { MapDetails } from '@/features/maps/components/map-details';
import { getMapDetails } from '@/features/maps/map-data';
import { EmptyState } from '@/shared/components/ui/empty-state';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

type MapPagePropsType = {
    params: Promise<{ mapName: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getQueryValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const MapHistoryQuerySchema = z.object({
    page: z.coerce.number().int().positive().catch(1),
});

export default async function MapPage({ params, searchParams }: MapPagePropsType) {
    const { mapName } = await params;
    const query = await searchParams;
    const { page } = MapHistoryQuerySchema.parse({ page: getQueryValue(query.page) });
    const map = await getMapDetails(mapName, page);

    return map ? (
        <MapDetails map={map} />
    ) : (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <EmptyState
                title="Map not found"
                message="That arena is not in the archive."
            />
        </div>
    );
}
