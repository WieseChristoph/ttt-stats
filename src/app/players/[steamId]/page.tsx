import { PlayerDetails } from '@/features/players/components/player-details';
import { getPlayerDetails } from '@/features/players/player-data';
import { EmptyState } from '@/shared/components/ui/empty-state';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: Promise<{ steamId: string }> }) {
    const { steamId } = await params;
    const player = await getPlayerDetails(steamId);

    return player ? (
        <PlayerDetails player={player} />
    ) : (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <EmptyState
                title="Player not found"
                message="This Steam ID has not appeared in a recorded round."
            />
        </div>
    );
}
