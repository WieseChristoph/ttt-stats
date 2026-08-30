import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Skull, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { MapDetailsType } from '@/features/maps/map-data';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { Pagination } from '@/shared/components/ui/pagination';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { TeamBadge } from '@/shared/components/ui/team-badge';
import { formatDate, formatDuration, formatNumber } from '@/shared/utils/format';

export function MapDetails({ map }: { map: MapDetailsType }) {
    return (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <Link
                className="mb-7 inline-flex items-center gap-1.75 text-(--muted) text-xs hover:text-(--purple) [&_svg]:w-3.75"
                href="/maps"
            >
                <ArrowLeft /> All maps
            </Link>
            <div className="mb-8.5 flex items-end justify-between gap-6 max-[850px]:flex-col max-[850px]:items-start">
                <h1 className="mb-3 text-[clamp(34px,5vw,62px)] leading-[0.98] tracking-[-0.065em]">{map.name}</h1>
            </div>
            <div className="mb-7 grid grid-cols-2 gap-3 min-[850px]:grid-cols-4">
                <MetricCard
                    label="Sessions"
                    value={formatNumber(map.totalSessions)}
                    icon={<CalendarDays />}
                    tone="blue"
                />
                <MetricCard
                    label="Rounds"
                    value={formatNumber(map.totalRounds)}
                    icon={<Trophy />}
                    tone="amber"
                />
                <MetricCard
                    label="Avg. round"
                    value={formatDuration(map.averageRoundDurationSeconds)}
                    icon={<Clock3 />}
                    tone="blue"
                />
                <MetricCard
                    label="Deaths"
                    value={formatNumber(map.totalDeaths)}
                    icon={<Skull />}
                    tone="red"
                />
            </div>
            <MapSessions map={map} />
        </div>
    );
}

function MapSessions({ map }: { map: MapDetailsType }) {
    return (
        <section className="min-w-0 rounded-2xl border border-(--line) bg-[linear-gradient(145deg,rgba(23,29,42,0.96),rgba(18,23,34,0.92))] p-6 max-[559px]:p-4.25">
            <SectionHeading title="Sessions" />
            {map.sessions.length ? (
                <div className="grid gap-3.5">
                    {map.sessions.map((session) => (
                        <MapSession
                            mapName={map.name}
                            session={session}
                            key={session.id}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No rounds"
                    message="This map has no completed rounds yet."
                />
            )}
            <Pagination
                basePath={`/maps/${encodeURIComponent(map.name)}`}
                page={map.pagination.page}
                totalPages={map.pagination.totalPages}
            />
        </section>
    );
}

function MapSession({ mapName, session }: { mapName: string; session: MapDetailsType['sessions'][number] }) {
    return (
        <article className="rounded-xl border border-(--line) bg-white/2.5 p-3.75">
            <div className="flex justify-between gap-3.75 px-2 pt-1 pb-3.5">
                <div>
                    <h3 className="mb-1.25 text-sm">{formatDate(session.startedAt)}</h3>
                    <p className="m-0 text-(--muted) text-[11px]">{session.roundCount} rounds</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-(--muted) text-[11px] [&_svg]:w-3.25">
                    <CalendarDays />
                    {session.lastRoundAt ? `Last round ${formatDate(session.lastRoundAt)}` : 'No completed rounds'}
                </span>
            </div>
            <div className="grid gap-1.5">
                <RoundTableHeader />
                {session.rounds.map((round, index) => (
                    <MapRoundRow
                        index={index}
                        mapName={mapName}
                        round={round}
                        key={round.id}
                    />
                ))}
            </div>
        </article>
    );
}

function RoundTableHeader() {
    return (
        <div className="hidden grid-cols-[64px_minmax(180px,1.4fr)_minmax(300px,2.1fr)_20px] items-center gap-3.5 px-2.25 pb-2 font-semibold text-(--muted) text-[9px] uppercase tracking-[0.04em] min-[850px]:grid">
            <span>Round</span>
            <span>Played</span>
            <span className="grid grid-cols-[minmax(90px,1fr)_minmax(70px,0.8fr)_minmax(110px,1fr)] items-center gap-3.5 [&>span:not(:last-child)]:text-center">
                <span>Duration</span>
                <span>Players</span>
                <span>Winner</span>
            </span>
            <span />
        </div>
    );
}

function MapRoundRow({
    index,
    mapName,
    round,
}: {
    index: number;
    mapName: string;
    round: MapDetailsType['sessions'][number]['rounds'][number];
}) {
    const seconds = (new Date(round.endedAt).getTime() - new Date(round.startedAt).getTime()) / 1000;

    return (
        <Link
            className="group grid grid-cols-[54px_minmax(0,1fr)_16px] items-center gap-x-3 gap-y-2.5 rounded-[10px] border-(--line) border-t p-3 hover:bg-white/4.5 min-[850px]:grid-cols-[64px_minmax(180px,1.4fr)_minmax(300px,2.1fr)_20px] min-[850px]:gap-3.5"
            href={`/maps/${encodeURIComponent(mapName)}/rounds/${round.id}`}
        >
            <b className="text-sm tabular-nums max-[849px]:col-start-1 max-[849px]:row-start-1">#{index + 1}</b>
            <time
                className="font-bold text-sm tabular-nums max-[849px]:col-start-2 max-[849px]:row-start-1 max-[849px]:grid max-[849px]:gap-1 max-[849px]:before:font-semibold max-[849px]:before:text-(--muted) max-[849px]:before:text-[9px] max-[849px]:before:uppercase max-[849px]:before:tracking-[0.04em] max-[849px]:before:content-[attr(data-label)]"
                data-label="Played"
                dateTime={round.startedAt}
            >
                {formatDate(round.startedAt)}
            </time>
            <span className="grid grid-cols-[minmax(90px,1fr)_minmax(70px,0.8fr)_minmax(110px,1fr)] items-center gap-3.5 max-[849px]:col-span-2 max-[849px]:col-start-2 max-[849px]:row-start-2 max-[559px]:grid-cols-2 max-[559px]:gap-2">
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
            <ArrowUpRight className="w-3.75 text-(--muted) max-[849px]:col-start-3 max-[849px]:row-start-1" />
        </Link>
    );
}
