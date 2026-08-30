import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { DashboardDataType } from '@/features/dashboard/dashboard-data';
import { TeamBadge } from '@/shared/components/ui/team-badge';
import { formatDate, formatDuration } from '@/shared/utils/format';

type RecentRoundsPropsType = { rounds: DashboardDataType['recentRounds'] };

export function RecentRounds({ rounds }: RecentRoundsPropsType) {
    return (
        <div className="grid gap-1.5">
            <div className="hidden grid-cols-[minmax(180px,1.4fr)_minmax(180px,1.2fr)_minmax(300px,2.1fr)_20px] items-center gap-3.5 px-2.25 pb-2 font-semibold text-(--muted) text-[9px] uppercase tracking-[0.04em] min-[850px]:grid">
                <span>Map</span>
                <span>Played</span>
                <span className="grid grid-cols-[minmax(90px,1fr)_minmax(70px,0.8fr)_minmax(110px,1fr)] items-center gap-3.5 [&>span:not(:last-child)]:text-center">
                    <span>Duration</span>
                    <span>Players</span>
                    <span>Winner</span>
                </span>
                <span />
            </div>
            {rounds.map((round) => (
                <RecentRoundRow
                    round={round}
                    key={round.id}
                />
            ))}
        </div>
    );
}

function RecentRoundRow({ round }: { round: DashboardDataType['recentRounds'][number] }) {
    const seconds = (new Date(round.endedAt).getTime() - new Date(round.startedAt).getTime()) / 1000;

    return (
        <Link
            className="group grid grid-cols-[minmax(0,1fr)_16px] items-center gap-x-3 gap-y-2.5 rounded-[10px] px-2.25 py-3 hover:bg-white/4.5 min-[850px]:grid-cols-[minmax(180px,1.4fr)_minmax(180px,1.2fr)_minmax(300px,2.1fr)_20px] min-[850px]:gap-3.5 min-[850px]:py-3"
            href={`/maps/${encodeURIComponent(round.mapName)}/rounds/${round.id}`}
        >
            <strong className="min-w-0 truncate font-bold text-(--text) text-sm max-[849px]:col-start-1 max-[849px]:row-start-1 min-[850px]:col-auto">
                {round.mapName}
            </strong>
            <time
                className="font-bold text-sm tabular-nums max-[849px]:col-start-1 max-[849px]:row-start-2 max-[849px]:grid max-[849px]:gap-1 max-[849px]:before:font-semibold max-[849px]:before:text-(--muted) max-[849px]:before:text-[9px] max-[849px]:before:uppercase max-[849px]:before:tracking-[0.04em] max-[849px]:before:content-[attr(data-label)]"
                data-label="Played"
                dateTime={round.endedAt}
            >
                {formatDate(round.endedAt)}
            </time>
            <span className="grid grid-cols-[minmax(90px,1fr)_minmax(70px,0.8fr)_minmax(110px,1fr)] items-center gap-3.5 max-[849px]:col-span-2 max-[849px]:col-start-1 max-[849px]:row-start-3 max-[559px]:grid-cols-2 max-[559px]:gap-2">
                <b
                    className="text-center text-(--text) text-[15px] tabular-nums max-[849px]:grid max-[849px]:gap-1 max-[849px]:before:font-semibold max-[849px]:before:text-(--muted) max-[849px]:before:text-[9px] max-[849px]:before:uppercase max-[849px]:before:tracking-[0.04em] max-[849px]:before:content-[attr(data-label)]"
                    data-label="Duration"
                >
                    {formatDuration(seconds)}
                </b>
                <b
                    className="text-center text-(--text) text-[15px] tabular-nums max-[849px]:grid max-[849px]:gap-1 max-[849px]:before:font-semibold max-[849px]:before:text-(--muted) max-[849px]:before:text-[9px] max-[849px]:before:uppercase max-[849px]:before:tracking-[0.04em] max-[849px]:before:content-[attr(data-label)]"
                    data-label="Players"
                >
                    {round.playerCount}
                </b>
                <span
                    className="flex justify-start max-[849px]:col-span-2 max-[849px]:grid max-[849px]:gap-1 max-[849px]:before:font-semibold max-[849px]:before:text-(--muted) max-[849px]:before:text-[9px] max-[849px]:before:uppercase max-[849px]:before:tracking-[0.04em] max-[849px]:before:content-[attr(data-label)]"
                    data-label="Winner"
                >
                    <TeamBadge teamName={round.winningTeam} />
                </span>
            </span>
            <ArrowUpRight className="w-3.75 text-(--muted) max-[849px]:col-start-2 max-[849px]:row-start-1" />
        </Link>
    );
}
