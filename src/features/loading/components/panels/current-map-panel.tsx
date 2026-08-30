import { Activity, Clock3, Map as MapIcon, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { getTeamPresentation } from '@/shared/team';
import { formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/ui';
import { LoadingMetric, PanelHeader, panelClassName, TeamPill } from '../loading-ui';

type CurrentMapPanelPropsType = {
    snapshot: Pick<LoadingSnapshotType, 'latestRound' | 'mapStats' | 'requestedMap'>;
};

export function CurrentMapPanel({ snapshot }: CurrentMapPanelPropsType) {
    const currentMapName = snapshot.requestedMap?.name ?? snapshot.latestRound.session.map.name;
    const currentMapStats = snapshot.requestedMap ? snapshot.requestedMap.stats : snapshot.mapStats;
    const latestWinner = getTeamPresentation(snapshot.latestRound.winningTeam);

    return (
        <section
            className={cn(
                panelClassName,
                'col-span-1 border-violet-400/25 bg-[radial-gradient(circle_at_90%_100%,rgba(139,92,246,0.18),transparent_55%),linear-gradient(145deg,rgba(20,26,39,0.98),rgba(18,23,34,0.96))] xl:col-span-5',
            )}
        >
            <PanelHeader
                icon={<MapIcon />}
                title="Current map"
                badge="Loading"
            />
            <div className="flex min-h-0 flex-1 items-center py-2 xl:py-4">
                <h1 className="wrap-break-word m-0 max-w-full font-black text-[clamp(2.1rem,3.6vw,4.5rem)] leading-[0.88] tracking-[-0.065em]">
                    {currentMapName}
                </h1>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <LoadingMetric
                    icon={<Trophy />}
                    label="Rounds"
                    value={formatNumber(currentMapStats?.rounds)}
                />
                <LoadingMetric
                    icon={<Clock3 />}
                    label="Sessions"
                    value={formatNumber(currentMapStats?.sessions)}
                />
                <LoadingMetric
                    icon={<Users />}
                    label="Players"
                    value={formatNumber(currentMapStats?.players)}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths"
                    value={formatNumber(currentMapStats?.deaths)}
                />
            </div>
            <div className="mt-3 flex items-center justify-between border-white/8 border-t pt-3 text-[13px] text-slate-400">
                <span className="flex items-center gap-1.5">
                    <Activity className="size-4 text-violet-400" /> Latest result
                </span>
                <TeamPill team={latestWinner} />
            </div>
        </section>
    );
}
