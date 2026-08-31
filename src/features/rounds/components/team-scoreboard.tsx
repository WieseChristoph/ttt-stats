import { buildTeamScoreboard } from '@/features/rounds/round-analytics';
import type { FullRoundType } from '@/features/rounds/round-data';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { TeamBadge } from '@/shared/components/ui/team-badge';
import { percentage } from '@/shared/stats';
import { formatNumber, formatPercentage } from '@/shared/utils/format';

export function TeamScoreboard({ round }: { round: FullRoundType }) {
    const teams = buildTeamScoreboard(round);
    const hasDamageTelemetry = round.players.some((player) => player.damageDealt !== null);

    return (
        <section className="mb-3.5 rounded-2xl border border-(--line) bg-(--panel) p-6 max-[559px]:p-4.25">
            <SectionHeading title="Final-team scoreboard" />
            <div className="overflow-x-auto">
                <div className="min-w-160">
                    <div className="grid grid-cols-[minmax(140px,1.4fr)_repeat(7,minmax(62px,1fr))] gap-3 px-3 pb-2 text-right font-semibold text-(--muted) text-[9px] uppercase [&>span:first-child]:text-left">
                        <span>Team</span>
                        <span>Players</span>
                        <span>Survivors</span>
                        <span>Kills</span>
                        <span>Deaths</span>
                        <span>Teamkills</span>
                        <span>Damage</span>
                        <span>Accuracy</span>
                    </div>
                    {teams.map(({ team, stats }) => (
                        <div
                            className="grid grid-cols-[minmax(140px,1.4fr)_repeat(7,minmax(62px,1fr))] items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm hover:bg-white/4 [&>span:first-child]:text-left"
                            key={team}
                        >
                            <span>
                                <TeamBadge teamName={team} />
                            </span>
                            <span>{stats.players}</span>
                            <span>{stats.survivors}</span>
                            <span>{stats.kills}</span>
                            <span>{stats.deaths}</span>
                            <span>{stats.teamKills}</span>
                            <span>{hasDamageTelemetry ? formatNumber(stats.damage) : '—'}</span>
                            <span>{formatPercentage(percentage(stats.hits, stats.shots))}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
