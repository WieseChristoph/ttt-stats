import { Clock3, Crosshair, Map as MapIcon, Shield, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { getTeamPresentation } from '@/shared/team';
import { formatDate, formatDuration, formatNumber } from '@/shared/utils/format';
import { LoadingMetric, PanelHeader, panelClassName, TeamPill } from '../loading-ui';

type LastRoundPanelPropsType = {
    snapshot: Pick<LoadingSnapshotType, 'latestRound' | 'recentRounds'>;
};

export function LastRoundPanel({ snapshot }: LastRoundPanelPropsType) {
    const latestWinner = getTeamPresentation(snapshot.latestRound.winningTeam);
    const latestDuration = Math.max(
        0,
        (new Date(snapshot.latestRound.endedAt).getTime() - new Date(snapshot.latestRound.startedAt).getTime()) / 1000,
    );
    const latestSurvivors = snapshot.latestRound.players.filter((player) => player.deaths === 0).length;
    const latestKills = snapshot.latestRound.players.reduce((total, player) => total + player.kills, 0);
    const latestDeaths = snapshot.latestRound.players.reduce((total, player) => total + player.deaths, 0);

    return (
        <section className={`${panelClassName} col-span-1 xl:col-span-7`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <PanelHeader
                        icon={<Trophy />}
                        title="Last round"
                    />
                    <h2 className="mt-1 mb-0 font-black text-[clamp(1.5rem,2vw,2.25rem)] tracking-[-0.045em]">
                        {latestWinner.label} victory
                    </h2>
                </div>
                <div className="grid justify-items-end gap-1.5">
                    <TeamPill team={latestWinner} />
                    <span className="text-slate-500 text-xs">{formatDate(snapshot.latestRound.endedAt)}</span>
                </div>
            </div>
            <div className="my-2.5 grid grid-cols-3 gap-2">
                <LoadingMetric
                    icon={<MapIcon />}
                    label="Map"
                    value={snapshot.latestRound.session.map.name}
                    valueClassName="text-base! leading-[1.15]! tracking-tight!"
                />
                <LoadingMetric
                    icon={<Clock3 />}
                    label="Duration"
                    value={formatDuration(latestDuration)}
                />
                <LoadingMetric
                    icon={<Users />}
                    label="Players"
                    value={formatNumber(snapshot.latestRound.players.length)}
                />
                <LoadingMetric
                    icon={<Shield />}
                    label="Survivors"
                    value={formatNumber(latestSurvivors)}
                />
                <LoadingMetric
                    icon={<Crosshair />}
                    label="Kills"
                    value={formatNumber(latestKills)}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths"
                    value={formatNumber(latestDeaths)}
                />
            </div>
            <div className="mt-2 min-h-0 flex-1">
                <div className="mb-1.5 font-bold text-slate-500 text-xs uppercase tracking-[0.12em]">
                    Recent results
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {snapshot.recentRounds.map((round) => (
                        <RecentRoundCard
                            round={round}
                            key={round.id}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function RecentRoundCard({ round }: { round: LoadingSnapshotType['recentRounds'][number] }) {
    const winner = getTeamPresentation(round.winningTeam);
    const duration = Math.max(0, (new Date(round.endedAt).getTime() - new Date(round.startedAt).getTime()) / 1000);

    return (
        <div className="min-w-0 rounded-lg border border-white/5 bg-white/3 px-2.5 py-1.5">
            <strong className="block truncate text-[13px] text-slate-100">{round.mapName}</strong>
            <div className="mt-1 flex min-w-0 items-center justify-between gap-2 text-[11px]">
                <span
                    className="flex min-w-0 items-center gap-1.5 truncate"
                    style={{ color: winner.color }}
                >
                    <span
                        className="size-1.75 shrink-0 rounded-full"
                        style={{ backgroundColor: winner.color }}
                    />
                    {winner.label}
                </span>
                <span className="shrink-0 text-slate-500">
                    {round.playerCount}p · {formatDuration(duration)}
                </span>
            </div>
        </div>
    );
}
