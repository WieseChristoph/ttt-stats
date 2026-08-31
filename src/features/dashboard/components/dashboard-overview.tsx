import { Clock3, Crosshair, Map as MapIcon, Skull, Target, Trophy, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { DateFilter } from '@/features/dashboard/components/date-filter';
import { PlayerLeaderboard } from '@/features/dashboard/components/player-leaderboard';
import { RecentRounds } from '@/features/dashboard/components/recent-rounds';
import type { DashboardDataType } from '@/features/dashboard/dashboard-data';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { RoleBadge } from '@/shared/components/ui/role-badge';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { StatsChart } from '@/shared/components/ui/stats-chart';
import { formatWeaponLabel, percentage } from '@/shared/stats';
import { getTeamPresentation } from '@/shared/team';
import { formatDuration, formatNumber, formatPercentage } from '@/shared/utils/format';

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
            <PaceMetrics dashboard={dashboard} />
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
                <DashboardPanel title="Weapon effectiveness">
                    <WeaponTable weapons={dashboard.weapons} />
                </DashboardPanel>
                <DashboardPanel
                    title="Activity trend"
                    wide
                >
                    <StatsChart
                        type="line"
                        labels={dashboard.trends.map((entry) => entry.week)}
                        datasets={[
                            {
                                label: 'Rounds',
                                values: dashboard.trends.map((entry) => entry.rounds),
                                colors: ['#9d8cff'],
                                order: 2,
                            },
                            {
                                label: 'Average players',
                                values: dashboard.trends.map((entry) =>
                                    entry.rounds ? entry.playerRounds / entry.rounds : 0,
                                ),
                                colors: ['#63d471'],
                                axis: 'secondary',
                                fill: false,
                                order: 1,
                            },
                        ]}
                        height={280}
                    />
                </DashboardPanel>
                <DashboardPanel
                    title="Final-role performance"
                    wide
                >
                    {dashboard.roles.length ? (
                        <RoleTable roles={dashboard.roles} />
                    ) : (
                        <EmptyState
                            title="Role telemetry unavailable"
                            message="Role performance will appear when completed rounds include final subroles."
                        />
                    )}
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

function PaceMetrics({ dashboard }: { dashboard: DashboardDataType }) {
    const rounds = dashboard.totals?.rounds ?? 0;
    const playerRounds = dashboard.totals?.playerRounds ?? 0;
    const enemyKills = dashboard.combat?.enemyKills ?? 0;
    const shots = dashboard.telemetry?.shotsFired ?? 0;
    const hits = dashboard.telemetry?.shotsHit ?? 0;

    return (
        <div className="mb-7 grid grid-cols-2 gap-3 min-[850px]:grid-cols-4">
            <MetricCard
                label="Avg. lobby"
                value={formatNumber(rounds ? playerRounds / rounds : 0)}
                detail="players per round"
                icon={<Users />}
                tone="blue"
            />
            <MetricCard
                label="Avg. round"
                value={formatDuration(dashboard.pace?.averageRoundDurationSeconds)}
                icon={<Clock3 />}
                tone="amber"
            />
            <MetricCard
                label="Enemy kills / round"
                value={formatNumber(rounds ? enemyKills / rounds : 0)}
                icon={<Crosshair />}
                tone="red"
            />
            <MetricCard
                label="Accuracy"
                value={shots ? formatPercentage((hits / shots) * 100) : '—'}
                icon={<Target />}
                tone="green"
            />
        </div>
    );
}

function WeaponTable({ weapons }: { weapons: DashboardDataType['weapons'] }) {
    return weapons.length ? (
        <div className="grid gap-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_62px_62px_62px] gap-2 px-2 pb-1 font-semibold text-(--muted) text-[9px] uppercase [&>span:not(:first-child)]:text-right">
                <span>Weapon</span>
                <span>Users</span>
                <span>Kills</span>
                <span>Accuracy</span>
            </div>
            {weapons.map((weapon) => {
                const accuracy = percentage(Number(weapon.shotsHit ?? 0), Number(weapon.shotsFired ?? 0));
                return (
                    <div
                        className="grid grid-cols-[minmax(0,1fr)_repeat(3,62px)] items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/4"
                        key={weapon.weaponName}
                    >
                        <strong className="truncate text-xs">{formatWeaponLabel(weapon.weaponName)}</strong>
                        <span className="text-right text-(--muted) text-xs">{formatNumber(weapon.users)} users</span>
                        <b className="text-right text-(--amber) text-sm">{formatNumber(weapon.kills)}</b>
                        <b className="text-right text-sm">{formatPercentage(accuracy)}</b>
                    </div>
                );
            })}
        </div>
    ) : (
        <EmptyState
            title="No weapon data"
            message="No weapon kills were recorded in this date range."
        />
    );
}

function RoleTable({ roles }: { roles: DashboardDataType['roles'] }) {
    return (
        <div className="overflow-x-auto">
            <div className="min-w-175">
                <div className="grid grid-cols-[minmax(170px,1.5fr)_90px_repeat(5,100px)] gap-3 px-3 pb-2 font-semibold text-(--muted) text-[9px] uppercase [&>span:not(:first-child)]:text-right">
                    <span>Final role</span>
                    <span>Rounds</span>
                    <span>Wins</span>
                    <span>Win rate</span>
                    <span>Enemy K/D</span>
                    <span>Accuracy</span>
                    <span>Damage / round</span>
                </div>
                {roles.map((role) => {
                    const accuracy = percentage(Number(role.shotsHit ?? 0), Number(role.shotsFired ?? 0));
                    return (
                        <div
                            className="grid grid-cols-[minmax(170px,1.5fr)_90px_repeat(5,100px)] items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/4 [&>span:not(:first-child)]:text-right"
                            key={role.roleName}
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <RoleBadge roleName={role.roleName} />
                            </span>
                            <span>{formatNumber(role.appearances)}</span>
                            <span>{formatNumber(role.wins)}</span>
                            <span>{formatPercentage(percentage(role.wins, role.appearances))}</span>
                            <span>
                                {role.deaths ? (role.kills / role.deaths).toFixed(2) : formatNumber(role.kills)}
                            </span>
                            <span>{formatPercentage(accuracy)}</span>
                            <span>
                                {role.telemetryRounds
                                    ? formatNumber(Number(role.damageDealt ?? 0) / role.telemetryRounds)
                                    : '—'}
                            </span>
                        </div>
                    );
                })}
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
