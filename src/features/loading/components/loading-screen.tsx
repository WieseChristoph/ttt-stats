import { Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { formatDate } from '@/shared/utils/format';
import { LoadingCanvas } from './loading-canvas';
import { CurrentMapPanel } from './panels/current-map-panel';
import { LastRoundPanel } from './panels/last-round-panel';
import { OverallStatsPanel } from './panels/overall-stats-panel';
import { PlayerStatsPanel } from './panels/player-stats-panel';

type LoadingScreenPropsType = {
    snapshot: LoadingSnapshotType | null;
};

export function LoadingScreen({ snapshot }: LoadingScreenPropsType) {
    if (!snapshot) {
        return <NoRoundsState />;
    }

    const currentMapName = snapshot.requestedMap?.name ?? snapshot.latestRound.session.map.name;

    return (
        <div className="fixed inset-0 z-100 h-dvh overflow-hidden bg-[#080b11] text-slate-100">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_-15%,rgba(139,92,246,0.18),transparent_42rem),radial-gradient(circle_at_5%_105%,rgba(255,102,117,0.08),transparent_30rem)]" />
            <LoadingCanvas>
                <LoadingHeader
                    currentMapName={currentMapName}
                    latestRoundEndedAt={snapshot.latestRound.endedAt}
                />
                <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-3 xl:grid-cols-12 xl:gap-4">
                    <CurrentMapPanel snapshot={snapshot} />
                    <PlayerStatsPanel player={snapshot.requestedPlayer} />
                    <OverallStatsPanel snapshot={snapshot} />
                    <LastRoundPanel snapshot={snapshot} />
                </div>
            </LoadingCanvas>
        </div>
    );
}

function NoRoundsState() {
    return (
        <div className="fixed inset-0 z-100 grid h-dvh place-items-center overflow-hidden bg-[#080b11] p-6 text-slate-100">
            <div className="rounded-2xl border border-white/10 bg-[#121722] px-10 py-9 text-center shadow-2xl">
                <Trophy className="mx-auto mb-4 size-8 text-violet-400" />
                <h1 className="m-0 font-bold text-2xl tracking-tight">No rounds recorded yet</h1>
                <p className="mt-2 mb-0 text-slate-400 text-sm">Stats will appear after the first completed round.</p>
            </div>
        </div>
    );
}

function LoadingHeader({ currentMapName, latestRoundEndedAt }: { currentMapName: string; latestRoundEndedAt: string }) {
    return (
        <header className="flex min-w-0 items-center justify-between gap-4 px-1">
            <Link
                className="flex items-center gap-2.5"
                href="/"
            >
                <Image
                    className="size-8 rounded-lg shadow-lg"
                    src="/ttt.png"
                    alt="TTT Stats"
                    width={32}
                    height={32}
                    priority
                />
                <div className="font-black text-base tracking-[-0.04em]">
                    <span className="text-[#ff6675]">TTT</span> Stats
                </div>
            </Link>
            <div className="flex min-w-0 items-center gap-2 text-[13px] text-slate-400">
                <span className="size-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.75)]" />
                <span className="truncate">Connecting to {currentMapName}</span>
                <span className="hidden text-slate-600 sm:inline">•</span>
                <span className="hidden whitespace-nowrap sm:inline">{formatDate(latestRoundEndedAt)}</span>
            </div>
        </header>
    );
}
