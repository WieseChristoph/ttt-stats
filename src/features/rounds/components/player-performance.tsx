import Link from 'next/link';
import type { FullRoundType } from '@/features/rounds/round-data';
import { Avatar } from '@/shared/components/ui/avatar';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { TeamBadge } from '@/shared/components/ui/team-badge';
import { displayName, labelize } from '@/shared/utils/format';

export function PlayerPerformance({ players }: { players: FullRoundType['players'] }) {
    return (
        <section className="min-w-0 rounded-2xl border border-(--line) bg-[linear-gradient(145deg,rgba(23,29,42,0.96),rgba(18,23,34,0.92))] p-6 max-[559px]:p-4.25">
            <SectionHeading
                title="Player performance"
                action={<PlayerPerformanceHeader />}
            />
            {players.length ? (
                <div className="grid gap-0.5">
                    {players.map((entry) => (
                        <PlayerPerformanceRow
                            entry={entry}
                            key={entry.id}
                        />
                    ))}
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
        <div className="grid min-w-47.5 grid-cols-3 gap-3 self-end text-right font-semibold text-(--muted) text-[9px] uppercase tracking-[0.04em]">
            <span>Kills</span>
            <span>Deaths</span>
            <span>Team kills</span>
        </div>
    );
}

function PlayerPerformanceRow({ entry }: { entry: FullRoundType['players'][number] }) {
    return (
        <Link
            className="group grid grid-cols-[34px_minmax(0,1fr)_auto_minmax(190px,auto)] items-center gap-3 rounded-[10px] px-2.25 py-2.5 hover:bg-white/4.5 max-[559px]:grid-cols-[34px_minmax(0,1fr)] max-[559px]:gap-2"
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
                    {entry.finalSubroleName ? labelize(entry.finalSubroleName) : 'Role unavailable'}
                </small>
            </span>
            <span className="max-[559px]:col-start-2 max-[559px]:row-start-2">
                <TeamBadge teamName={entry.finalTeamName} />
            </span>
            <div className="grid min-w-47.5 grid-cols-3 gap-3 max-[559px]:col-start-2 max-[559px]:min-w-0">
                <b className="text-right text-(--amber) text-[15px] max-[559px]:text-left">{entry.kills}</b>
                <b className="text-right text-(--amber) text-[15px] max-[559px]:text-left">{entry.deaths}</b>
                <b className="text-right text-(--amber) text-[15px] max-[559px]:text-left">{entry.teamKills}</b>
            </div>
        </Link>
    );
}
