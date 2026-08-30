import { PlayerBrowser } from '@/features/players/components/player-browser';
import { getPlayerCards } from '@/features/players/player-data';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
    const players = await getPlayerCards();

    return (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <h1 className="mb-8! font-black text-3xl text-white tracking-tight">Players</h1>
            <PlayerBrowser players={players} />
        </div>
    );
}
