import Link from 'next/link';
import type { FullRoundType } from '@/features/rounds/round-data';
import { Avatar } from '@/shared/components/ui/avatar';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { TeamBadge } from '@/shared/components/ui/team-badge';
import { percentage } from '@/shared/stats';
import { displayName, formatDuration, formatNumber, formatPercentage, labelize } from '@/shared/utils/format';

export function PlayerPerformance({ players }: { players: FullRoundType['players'] }) {
    return (
        <section className="min-w-0 rounded-2xl border border-(--line) bg-[linear-gradient(145deg,rgba(23,29,42,0.96),rgba(18,23,34,0.92))] p-6 max-[559px]:p-4.25">
            <SectionHeading title="Player performance" />
            {players.length ? (
                <div className="overflow-x-auto">
                    <div className="min-w-180">
                        <PlayerPerformanceHeader />
                        {players.map((entry) => (
                            <PlayerPerformanceRow
                                entry={entry}
                                key={entry.id}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <EmptyState
                    title="No players"
                    message="This round has no player records."
                />
            )}
        </section>
    );
}

function PlayerPerformanceHeader() {
    return (
        <div className="grid grid-cols-[34px_minmax(160px,1.5fr)_100px_repeat(7,minmax(66px,1fr))] gap-3 px-2.25 pb-2 text-right font-semibold text-(--muted) text-[9px] uppercase tracking-[0.04em] [&>span:nth-child(-n+3)]:text-left">
            <span />
            <span>Player / role</span>
            <span>Team</span>
            <span>Kills</span>
            <span>Deaths</span>
            <span>Team kills</span>
            <span>Damage</span>
            <span>Taken</span>
            <span>Accuracy</span>
            <span>Survival</span>
        </div>
    );
}

function PlayerPerformanceRow({ entry }: { entry: FullRoundType['players'][number] }) {
    return (
        <Link
            className="group grid grid-cols-[34px_minmax(160px,1.5fr)_100px_repeat(7,minmax(66px,1fr))] items-center gap-3 rounded-[10px] px-2.25 py-2.5 hover:bg-white/4.5"
            href={`/players/${entry.player.steamId}`}
        >
            <Avatar
                name={entry.player.username}
                steamId={entry.player.steamId}
                src={entry.player.avatarMedium}
                size="small"
            />
            <span className="grid min-w-0 gap-0.75">
                <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                    {displayName(entry.player.username, entry.player.steamId)}
                </strong>
                <small className="text-(--muted) text-[10px]">
                    {entry.initialSubroleName && entry.initialSubroleName !== entry.finalSubroleName
                        ? `${labelize(entry.initialSubroleName)} → ${labelize(entry.finalSubroleName)}`
                        : entry.finalSubroleName
                          ? labelize(entry.finalSubroleName)
                          : 'Role unavailable'}
                </small>
            </span>
            <span>
                <TeamBadge teamName={entry.finalTeamName} />
            </span>
            <b className="text-right text-(--amber) text-[15px]">{Math.max(0, entry.kills - entry.teamKills)}</b>
            <b className="text-right text-[15px]">{entry.deaths}</b>
            <b className="text-right text-[15px]">{entry.teamKills}</b>
            <b className="text-right text-[15px]">{formatNumber(entry.damageDealt)}</b>
            <b className="text-right text-[15px]">{formatNumber(entry.damageTaken)}</b>
            <b className="text-right text-[15px]">
                {formatPercentage(percentage(entry.shotsHit ?? 0, entry.shotsFired ?? 0))}
            </b>
            <b className="text-right text-[15px]">{formatDuration(entry.survivalSeconds)}</b>
        </Link>
    );
}
