import { Map as MapIcon, Skull, Trophy, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { DateFilter } from '@/features/dashboard/components/date-filter';
import { PlayerLeaderboard } from '@/features/dashboard/components/player-leaderboard';
import { RecentRounds } from '@/features/dashboard/components/recent-rounds';
import { StatsChart } from '@/features/dashboard/components/stats-chart';
import type { DashboardDataType } from '@/features/dashboard/dashboard-data';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { getTeamPresentation } from '@/shared/team';
import { formatNumber } from '@/shared/utils/format';

export function DashboardOverview({ dashboard, from, to }: { dashboard: DashboardDataType; from: string; to: string }) {
    const totals = dashboard.totals;
    const teamWins = dashboard.teamWins.map((entry) => ({
        ...entry,
        presentation: getTeamPresentation(entry.team),
    }));

    return (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <h1 className="font-black text-3xl text-white tracking-tight">Overview</h1>
                <DateFilter
                    from={from}
                    to={to}
                />
            </div>
            <OverviewMetrics totals={totals} />
            <div className="mt-5 grid grid-cols-1 gap-3.5 min-[850px]:grid-cols-2">
                <DashboardPanel
                    title="Round wins by team"
                    wide
                >
                    <StatsChart
                        type="bar"
                        labels={teamWins.map((team) => team.presentation.label)}
                        datasets={[
                            {
                                label: 'Rounds won',
                                values: teamWins.map((team) => Number(team.wins)),
                                colors: teamWins.map((team) => team.presentation.color),
                            },
                        ]}
                    />
                </DashboardPanel>
                <DashboardPanel title="Top players">
                    {dashboard.topPlayers.length ? (
                        <PlayerLeaderboard players={dashboard.topPlayers} />
                    ) : (
                        <EmptyState
                            title="No player data"
                            message="No players appeared in this date range."
                        />
                    )}
                </DashboardPanel>
                <DashboardPanel title="Most-used weapons">
                    <StatsChart
                        type="bar"
                        labels={dashboard.weapons.map((weapon) => weapon.weaponName)}
                        datasets={[
                            {
                                label: 'Kills',
                                values: dashboard.weapons.map((weapon) => Number(weapon.kills)),
                                colors: ['#fb7185'],
                            },
                        ]}
                        height={320}
                    />
                </DashboardPanel>
                <DashboardPanel
                    title="Recent rounds"
                    wide
                >
                    {dashboard.recentRounds.length ? (
                        <RecentRounds rounds={dashboard.recentRounds} />
                    ) : (
                        <EmptyState
                            title="No recent rounds"
                            message="There is nothing to show yet."
                        />
                    )}
                </DashboardPanel>
            </div>
        </div>
    );
}

function OverviewMetrics({ totals }: { totals: DashboardDataType['totals'] }) {
    return (
        <div className="mb-7 grid grid-cols-2 gap-3 min-[850px]:grid-cols-4">
            <MetricCard
                label="Rounds"
                value={formatNumber(totals?.rounds ?? 0)}
                icon={<Trophy />}
                tone="amber"
            />
            <MetricCard
                label="Players"
                value={formatNumber(totals?.players ?? 0)}
                icon={<Users />}
                tone="blue"
            />
            <MetricCard
                label="Deaths"
                value={formatNumber(totals?.deaths ?? 0)}
                icon={<Skull />}
                tone="red"
            />
            <MetricCard
                label="Maps"
                value={formatNumber(totals?.maps ?? 0)}
                icon={<MapIcon />}
                tone="green"
            />
        </div>
    );
}

function DashboardPanel({ children, title, wide = false }: { children: ReactNode; title: string; wide?: boolean }) {
    return (
        <section
            className={`min-w-0 rounded-2xl border border-(--line) bg-[linear-gradient(145deg,rgba(23,29,42,0.96),rgba(18,23,34,0.92))] p-6 max-[559px]:p-4.25 ${wide ? 'min-[850px]:col-span-2' : ''}`}
        >
            <SectionHeading title={title} />
            {children}
        </section>
    );
}
