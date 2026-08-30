import { CircleX, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { PlayerDetailsType } from '@/features/players/player-data';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { TeamBadge } from '@/shared/components/ui/team-badge';
import { formatDate, labelize } from '@/shared/utils/format';
import { cn } from '@/shared/utils/ui';

export function PlayerRoundHistory({ rounds }: { rounds: PlayerDetailsType['rounds'] }) {
    return (
        <section className="min-w-0 rounded-2xl border border-(--line) bg-[linear-gradient(145deg,rgba(23,29,42,0.96),rgba(18,23,34,0.92))] p-6 max-[559px]:p-4.25">
            <SectionHeading title="Recent rounds" />
            {rounds.length ? (
                <div className="grid gap-1.5">
                    <PlayerRoundHistoryHeader />
                    {rounds.map((entry) => (
                        <PlayerRoundRow
                            entry={entry}
                            key={entry.id}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No rounds"
                    message="This player has no recorded rounds."
                />
            )}
        </section>
    );
}

function PlayerRoundHistoryHeader() {
    return (
        <div className="hidden grid-cols-[minmax(220px,1.4fr)_minmax(100px,0.7fr)_minmax(440px,2.35fr)_82px] items-center gap-3.5 px-2.25 pb-2 font-semibold text-(--muted) text-[9px] uppercase tracking-[0.04em] min-[850px]:grid">
            <span>Map / role</span>
            <span>Team</span>
            <span className="grid min-w-95 grid-cols-[minmax(150px,1.8fr)_repeat(3,minmax(52px,1fr))] items-center gap-3.5 [&>span:not(:first-child)]:text-center">
                <span>Played</span>
                <span>Kills</span>
                <span>Deaths</span>
                <span>Team kills</span>
            </span>
            <span>Result</span>
        </div>
    );
}

function PlayerRoundRow({ entry }: { entry: PlayerDetailsType['rounds'][number] }) {
    const won = entry.winningTeam === entry.teamName;

    return (
        <Link
            className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 rounded-[10px] p-3 hover:bg-white/4.5 min-[850px]:grid-cols-[minmax(220px,1.4fr)_minmax(100px,0.7fr)_minmax(440px,2.35fr)_82px] min-[850px]:gap-3.5"
            href={`/maps/${encodeURIComponent(entry.mapName)}/rounds/${entry.roundId}`}
        >
            <span className="grid min-w-0 gap-0.75 max-[849px]:col-start-1 max-[849px]:row-start-1 min-[850px]:col-auto">
                <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">{entry.mapName}</strong>
                <small className="font-semibold text-(--muted) text-[9px] uppercase tracking-[0.04em]">
                    {entry.subroleName ? labelize(entry.subroleName) : 'Role unavailable'}
                </small>
            </span>
            <span className="max-[849px]:col-start-1 max-[849px]:row-start-2 min-[850px]:col-auto">
                <TeamBadge teamName={entry.teamName} />
            </span>
            <span className="grid min-w-95 grid-cols-[minmax(150px,1.8fr)_repeat(3,minmax(52px,1fr))] items-center gap-3.5 max-[849px]:col-span-2 max-[849px]:col-start-1 max-[849px]:row-start-3 max-[849px]:min-w-0 max-[559px]:grid-cols-[minmax(115px,1.7fr)_repeat(3,minmax(40px,1fr))] max-[559px]:gap-2">
                <time
                    className="font-bold text-(--text) text-sm tabular-nums max-[849px]:grid max-[849px]:gap-0.75 max-[559px]:text-[13px] max-[849px]:before:font-semibold max-[849px]:before:text-(--muted) max-[849px]:before:text-[9px] max-[849px]:before:uppercase max-[849px]:before:tracking-[0.04em] max-[849px]:before:content-[attr(data-label)]"
                    data-label="Played"
                    dateTime={entry.roundStartedAt}
                >
                    {formatDate(entry.roundStartedAt)}
                </time>
                <PlayerRoundStat
                    label="Kills"
                    value={entry.kills}
                />
                <PlayerRoundStat
                    label="Deaths"
                    value={entry.deaths}
                />
                <PlayerRoundStat
                    label="Team kills"
                    value={entry.teamKills}
                />
            </span>
            <span
                className={cn(
                    'inline-flex min-w-18 items-center justify-center gap-1.5 rounded-full border border-current px-2.5 py-1.75 font-extrabold text-[11px] max-[849px]:col-start-2 max-[849px]:row-span-2 max-[849px]:row-start-1 max-[849px]:self-start max-[849px]:justify-self-end [&_svg]:size-3.25',
                    won
                        ? 'border-(--green) bg-[rgba(99,212,113,0.11)] text-(--green)'
                        : 'border-(--red) bg-[rgba(255,102,117,0.11)] text-(--red)',
                )}
            >
                {won ? <Trophy /> : <CircleX />}
                {won ? 'Won' : 'Lost'}
            </span>
        </Link>
    );
}

function PlayerRoundStat({ label, value }: { label: string; value: number }) {
    return (
        <b
            className="text-center text-(--text) text-[15px] tabular-nums max-[849px]:grid max-[849px]:gap-0.75 max-[559px]:text-[13px] max-[849px]:before:font-semibold max-[849px]:before:text-(--muted) max-[849px]:before:text-[9px] max-[849px]:before:uppercase max-[849px]:before:tracking-[0.04em] max-[849px]:before:content-[attr(data-label)]"
            data-label={label}
        >
            {value}
        </b>
    );
}
