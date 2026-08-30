import { Activity, Clock3, Map as MapIcon, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { getTeamPresentation } from '@/shared/team';
import { formatNumber } from '@/shared/utils/format';
import { LoadingMetric, PanelHeader, panelClassName } from '../loading-ui';

type OverallStatsPanelPropsType = {
    snapshot: Pick<LoadingSnapshotType, 'globalStats' | 'teamWins'>;
};

export function OverallStatsPanel({ snapshot }: OverallStatsPanelPropsType) {
    const visibleTeamWins = snapshot.teamWins.slice(0, 5);
    const highestTeamWins = Math.max(...visibleTeamWins.map((entry) => entry.wins), 1);

    return (
        <section className={`${panelClassName} col-span-1 xl:col-span-5`}>
            <PanelHeader
                icon={<Activity />}
                title="Overall stats"
            />
            <div className="mt-3 grid grid-cols-4 gap-2">
                <LoadingMetric
                    icon={<Trophy />}
                    label="Rounds"
                    value={formatNumber(snapshot.globalStats.rounds)}
                />
                <LoadingMetric
                    icon={<MapIcon />}
                    label="Maps"
                    value={formatNumber(snapshot.globalStats.maps)}
                />
                <LoadingMetric
                    icon={<Users />}
                    label="Players"
                    value={formatNumber(snapshot.globalStats.players)}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths"
                    value={formatNumber(snapshot.globalStats.deaths)}
                />
                <LoadingMetric
                    icon={<Clock3 />}
                    label="Sessions"
                    value={formatNumber(snapshot.globalStats.sessions)}
                />
                <LoadingMetric
                    icon={<Users />}
                    label="Player rounds"
                    value={formatNumber(snapshot.globalStats.playerRounds)}
                />
                <LoadingMetric
                    icon={<Activity />}
                    label="Avg players"
                    value={formatNumber(
                        snapshot.globalStats.rounds
                            ? snapshot.globalStats.playerRounds / snapshot.globalStats.rounds
                            : 0,
                    )}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths / round"
                    value={formatNumber(
                        snapshot.globalStats.rounds ? snapshot.globalStats.deaths / snapshot.globalStats.rounds : 0,
                    )}
                />
            </div>
            <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center gap-2">
                <div className="font-bold text-slate-500 text-xs uppercase tracking-[0.12em]">Round wins</div>
                {visibleTeamWins.map((entry) => (
                    <TeamWinRow
                        entry={entry}
                        highestTeamWins={highestTeamWins}
                        key={entry.team}
                    />
                ))}
            </div>
        </section>
    );
}

function TeamWinRow({
    entry,
    highestTeamWins,
}: {
    entry: LoadingSnapshotType['teamWins'][number];
    highestTeamWins: number;
}) {
    const team = getTeamPresentation(entry.team);

    return (
        <div className="grid grid-cols-[80px_minmax(0,1fr)_48px] items-center gap-2 text-[13px]">
            <span className="truncate text-slate-300">{team.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-white/5">
                <span
                    className="block h-full rounded-full"
                    style={{ width: `${(entry.wins / highestTeamWins) * 100}%`, backgroundColor: team.color }}
                />
            </span>
            <strong className="text-right text-slate-200 text-sm tabular-nums">{formatNumber(entry.wins)}</strong>
        </div>
    );
}
