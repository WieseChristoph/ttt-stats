import { RoundDetails } from '@/features/rounds/components/round-details';
import { getRoundDetails } from '@/features/rounds/round-data';
import { EmptyState } from '@/shared/components/ui/empty-state';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function RoundPage({ params }: { params: Promise<{ mapName: string; roundId: string }> }) {
    const { mapName, roundId: rawRoundId } = await params;
    const roundId = Number(rawRoundId);
    const round = Number.isSafeInteger(roundId) && roundId > 0 ? await getRoundDetails(mapName, roundId) : undefined;

    return round ? (
        <RoundDetails
            round={round}
            roundLabel={rawRoundId}
        />
    ) : (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <EmptyState
                title="Round not found"
                message="That round is not in the archive."
            />
        </div>
    );
}
