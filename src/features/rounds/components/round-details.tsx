import { ArrowLeft, Skull, Timer, Users } from 'lucide-react';
import Link from 'next/link';
import type { FullRoundType } from '@/features/rounds/round-data';
import { TeamBadge } from '@/shared/components/ui/team-badge';
import { formatDate, formatDuration } from '@/shared/utils/format';
import { EventFeed } from './event-feed';
import { PlayerPerformance } from './player-performance';

export function RoundDetails({ round, roundLabel }: { round: FullRoundType; roundLabel: string }) {
    const seconds = (new Date(round.endedAt).getTime() - new Date(round.startedAt).getTime()) / 1000;
    const players = [...round.players].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    const deathCount = round.events.filter((event) => event.type === 'death').length;

    return (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <Link
                className="mb-7 inline-flex items-center gap-1.75 text-(--muted) text-xs hover:text-(--purple) [&_svg]:w-3.75"
                href={`/maps/${encodeURIComponent(round.session.map.name)}`}
            >
                <ArrowLeft /> {round.session.map.name}
            </Link>
            <div className="mb-8.5 flex items-end justify-between gap-6 max-[850px]:flex-col max-[850px]:items-start">
                <div>
                    <h1 className="mb-3 text-[clamp(34px,5vw,62px)] leading-[0.98] tracking-[-0.065em]">
                        Round {roundLabel}
                    </h1>
                    <p className="max-w-140 text-(--muted) text-base leading-[1.55]">
                        {formatDate(round.startedAt)} · {formatDuration(seconds)}
                    </p>
                </div>
                <TeamBadge teamName={round.winningTeam} />
            </div>
            <RoundMetrics
                deaths={deathCount}
                players={players.length}
                seconds={seconds}
            />
            <div className="mt-3.5 grid grid-cols-1 gap-3.5 min-[850px]:grid-cols-2">
                <EventFeed round={round} />
                <PlayerPerformance players={players} />
            </div>
        </div>
    );
}

function RoundMetrics({ deaths, players, seconds }: { deaths: number; players: number; seconds: number }) {
    return (
        <div className="mb-7 grid grid-cols-2 gap-3 min-[850px]:grid-cols-3">
            <RoundMetric
                icon={<Timer className="size-4.75 text-(--amber)" />}
                label="Duration"
                value={formatDuration(seconds)}
            />
            <RoundMetric
                icon={<Users className="size-4.75 text-(--purple)" />}
                label="Players"
                value={String(players)}
            />
            <RoundMetric
                icon={<Skull className="size-4.75 text-(--red)" />}
                label="Deaths"
                value={String(deaths)}
            />
        </div>
    );
}

function RoundMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex min-h-22.5 items-center gap-3.5 rounded-[14px] border border-(--line) bg-(--panel) p-5 max-[559px]:min-h-26.25 max-[559px]:p-3.5">
            {icon}
            <span className="grid gap-1">
                <small className="text-(--muted) text-[11px]">{label}</small>
                <b className="font-extrabold text-[30px] tracking-[-0.06em] max-[559px]:text-[25px]">{value}</b>
            </span>
        </div>
    );
}
