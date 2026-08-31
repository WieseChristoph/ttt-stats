import {
    Activity,
    ArrowLeft,
    Clock3,
    Crosshair,
    Gauge,
    ShieldCheck,
    Skull,
    Target,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { PlayerDetailsType } from '@/features/players/player-data';
import { Avatar } from '@/shared/components/ui/avatar';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { RoleBadge } from '@/shared/components/ui/role-badge';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { StatsChart } from '@/shared/components/ui/stats-chart';
import { enemyKills, formatWeaponLabel, percentage } from '@/shared/stats';
import { displayName, formatDuration, formatNumber, formatPercentage } from '@/shared/utils/format';
import { PlayerRoundHistory } from './player-round-history';

export function PlayerDetails({ player }: { player: PlayerDetailsType }) {
    const { kills, deaths, wins, rounds } = player.totals;
    const combatKills = enemyKills(kills, player.totals.teamKills);
    const name = displayName(player.username, player.steamId);

    return (
        <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8">
            <Link
                className="mb-7 inline-flex items-center gap-1.75 text-(--muted) text-xs hover:text-(--purple) [&_svg]:w-3.75"
                href="/players"
            >
                <ArrowLeft /> Players
            </Link>
            <section className="mb-7 flex items-center gap-5 rounded-2xl border border-(--line) bg-(--panel) p-6.5 max-[559px]:p-4.5">
                <Avatar
                    name={name}
                    steamId={player.steamId}
                    src={player.avatarFull ?? player.avatarMedium}
                    size="large"
                />
                <div>
                    <h1 className="mb-1.75 text-[38px] leading-none tracking-[-0.065em] max-[559px]:text-[30px]">
                        {name}
                    </h1>
                    <p className="m-0 text-(--muted)">{player.steamId}</p>
                </div>
            </section>
            <div className="mb-3 grid grid-cols-2 gap-3 min-[850px]:grid-cols-4">
                <MetricCard
                    label="Rounds"
                    value={formatNumber(rounds)}
                    icon={<Users />}
                    tone="blue"
                />
                <MetricCard
                    label="Wins"
                    value={formatNumber(wins)}
                    icon={<Trophy />}
                    tone="green"
                />
                <MetricCard
                    label="Kills"
                    value={formatNumber(combatKills)}
                    icon={<Crosshair />}
                    tone="amber"
                />
                <MetricCard
                    label="Deaths"
                    value={formatNumber(deaths)}
                    icon={<Skull />}
                    tone="red"
                />
            </div>
            <PlayerRateMetrics player={player} />
            <PlayerTrend player={player} />
            <div className="mb-7 grid grid-cols-1 gap-3.5 min-[850px]:grid-cols-2">
                <RolePerformance player={player} />
                <Arsenal player={player} />
                <MapPerformance player={player} />
                <HeadToHead player={player} />
            </div>
            <PlayerRoundHistory rounds={player.rounds} />
        </div>
    );
}

function PlayerRateMetrics({ player }: { player: PlayerDetailsType }) {
    const totals = player.totals;
    const kills = enemyKills(totals.kills, totals.teamKills);
    const telemetryRounds = totals.telemetryRounds;

    return (
        <div className="mb-7 grid gap-3">
            <div className="grid grid-cols-2 gap-3 min-[850px]:grid-cols-4">
                <MetricCard
                    label="Enemy K/D"
                    value={totals.deaths ? (kills / totals.deaths).toFixed(2) : formatNumber(kills)}
                    icon={<Activity />}
                    tone="amber"
                />
                <MetricCard
                    label="Win rate"
                    value={formatPercentage(percentage(totals.wins, totals.rounds))}
                    icon={<ShieldCheck />}
                    tone="green"
                />
                <MetricCard
                    label="Headshot rate"
                    value={formatPercentage(percentage(player.headshots, player.headshotEligibleKills))}
                    icon={<Target />}
                    tone="amber"
                />
                <MetricCard
                    label="Accuracy"
                    value={formatPercentage(percentage(Number(totals.shotsHit ?? 0), Number(totals.shotsFired ?? 0)))}
                    icon={<Gauge />}
                    tone="blue"
                />
            </div>
            <div className="grid grid-cols-2 gap-3 min-[850px]:grid-cols-4">
                <MetricCard
                    label="Damage / round"
                    value={telemetryRounds ? formatNumber(Number(totals.damageDealt ?? 0) / telemetryRounds) : '—'}
                    icon={<Zap />}
                    tone="red"
                />
                <MetricCard
                    label="Damage taken / round"
                    value={telemetryRounds ? formatNumber(Number(totals.damageTaken ?? 0) / telemetryRounds) : '—'}
                    icon={<Zap />}
                    tone="red"
                />
                <MetricCard
                    label="Avg. survival"
                    value={
                        telemetryRounds ? formatDuration(Number(totals.survivalSeconds ?? 0) / telemetryRounds) : '—'
                    }
                    icon={<Clock3 />}
                    tone="green"
                />
                <MetricCard
                    label="Teamkill rate"
                    value={formatPercentage(percentage(totals.teamKills, totals.kills))}
                    icon={<Skull />}
                    tone="red"
                />
            </div>
        </div>
    );
}

function PlayerTrend({ player }: { player: PlayerDetailsType }) {
    const rounds = [...player.rounds].reverse();

    return (
        <section className="mb-7 rounded-2xl border border-(--line) bg-(--panel) p-6 max-[559px]:p-4.25">
            <SectionHeading title="Recent performance trend" />
            {rounds.length ? (
                <StatsChart
                    type="line"
                    fill={false}
                    height={280}
                    labels={rounds.map((entry) => entry.roundStartedAt.slice(0, 10))}
                    datasets={[
                        {
                            label: 'Enemy kills',
                            values: rounds.map((entry) => enemyKills(entry.kills, entry.teamKills)),
                            colors: ['#ffc857'],
                        },
                        { label: 'Deaths', values: rounds.map((entry) => entry.deaths), colors: ['#ff6675'] },
                        {
                            label: 'Damage / 100',
                            values: rounds.map((entry) =>
                                entry.damageDealt === null ? null : entry.damageDealt / 100,
                            ),
                            colors: ['#9d8cff'],
                        },
                    ]}
                />
            ) : (
                <EmptyState
                    title="No trend"
                    message="This player has no recorded rounds."
                />
            )}
        </section>
    );
}

function AnalyticsPanel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="min-w-0 rounded-2xl border border-(--line) bg-(--panel) p-6 max-[559px]:p-4.25">
            <SectionHeading title={title} />
            {children}
        </section>
    );
}

function RolePerformance({ player }: { player: PlayerDetailsType }) {
    return (
        <AnalyticsPanel title="Final-role performance">
            {player.roles.length ? (
                <div className="grid gap-1">
                    <AnalyticsTableHeader
                        columns={['Role', 'Rounds', 'Win rate', 'K/D']}
                        className="grid-cols-[minmax(0,1fr)_repeat(3,66px)]"
                    />
                    {player.roles.map((role) => (
                        <div
                            className="grid grid-cols-[minmax(0,1fr)_repeat(3,66px)] items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-white/4"
                            key={`${role.teamName}:${role.roleName}`}
                        >
                            <RoleBadge
                                roleName={role.roleName}
                                teamName={role.teamName}
                            />
                            <span className="text-right">{role.rounds}</span>
                            <span className="text-right">{formatPercentage(percentage(role.wins, role.rounds))}</span>
                            <span className="text-right">
                                {role.deaths ? (role.kills / role.deaths).toFixed(2) : role.kills}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Role telemetry unavailable"
                    message="Final roles were not recorded for this player."
                />
            )}
        </AnalyticsPanel>
    );
}

function Arsenal({ player }: { player: PlayerDetailsType }) {
    return (
        <AnalyticsPanel title="Arsenal">
            {player.weapons.length ? (
                <div className="grid gap-1">
                    <AnalyticsTableHeader
                        columns={['Weapon', 'Kills', 'Uses', 'Accuracy']}
                        className="grid-cols-[minmax(0,1fr)_repeat(3,64px)]"
                    />
                    {player.weapons.slice(0, 12).map((weapon) => (
                        <div
                            className="grid grid-cols-[minmax(0,1fr)_repeat(3,64px)] gap-2 rounded-lg px-2 py-2 text-xs hover:bg-white/4"
                            key={weapon.weaponName}
                        >
                            <strong className="truncate">{formatWeaponLabel(weapon.weaponName)}</strong>
                            <span className="text-right">{weapon.kills}</span>
                            <span className="text-right text-(--muted)">{weapon.uses}</span>
                            <span className="text-right">
                                {formatPercentage(
                                    percentage(Number(weapon.shotsHit ?? 0), Number(weapon.shotsFired ?? 0)),
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No weapon data"
                    message="No weapon kills were recorded for this player."
                />
            )}
        </AnalyticsPanel>
    );
}

function MapPerformance({ player }: { player: PlayerDetailsType }) {
    return (
        <AnalyticsPanel title="Map performance">
            {player.maps.length ? (
                <div className="grid gap-1">
                    <AnalyticsTableHeader
                        columns={['Map', 'Rounds', 'Win rate', 'K/D']}
                        className="grid-cols-[minmax(0,1fr)_repeat(3,66px)]"
                    />
                    {player.maps.slice(0, 12).map((map) => (
                        <Link
                            className="grid grid-cols-[minmax(0,1fr)_repeat(3,66px)] gap-2 rounded-lg px-2 py-2 text-xs hover:bg-white/4"
                            href={`/maps/${encodeURIComponent(map.mapName)}`}
                            key={map.mapName}
                        >
                            <strong className="truncate">{map.mapName}</strong>
                            <span className="text-right">{map.rounds}</span>
                            <span className="text-right">{formatPercentage(percentage(map.wins, map.rounds))}</span>
                            <span className="text-right">
                                {map.deaths ? (map.kills / map.deaths).toFixed(2) : map.kills}
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No map data"
                    message="No map performance is available."
                />
            )}
        </AnalyticsPanel>
    );
}

function HeadToHead({ player }: { player: PlayerDetailsType }) {
    return (
        <AnalyticsPanel title="Head-to-head">
            {player.headToHead.length ? (
                <div className="grid gap-1">
                    <AnalyticsTableHeader
                        columns={['', 'Player', 'Kills', 'Deaths', 'Net']}
                        className="grid-cols-[34px_minmax(0,1fr)_repeat(3,52px)]"
                    />
                    {player.headToHead.slice(0, 12).map((opponent) => (
                        <Link
                            className="grid grid-cols-[34px_minmax(0,1fr)_repeat(3,52px)] items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-white/4"
                            href={`/players/${opponent.steamId}`}
                            key={opponent.steamId}
                        >
                            <Avatar
                                name={opponent.username}
                                src={opponent.avatarMedium}
                                steamId={opponent.steamId}
                                size="small"
                            />
                            <strong className="truncate">{displayName(opponent.username, opponent.steamId)}</strong>
                            <b className="text-right text-(--green)">{opponent.kills}</b>
                            <b className="text-right text-(--red)">{opponent.deaths}</b>
                            <span className="text-right">
                                <b className="block">
                                    {opponent.kills - opponent.deaths > 0 ? '+' : ''}
                                    {opponent.kills - opponent.deaths}
                                </b>
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No head-to-head data"
                    message="No player-attributed encounters were recorded."
                />
            )}
        </AnalyticsPanel>
    );
}

function AnalyticsTableHeader({ columns, className }: { columns: string[]; className: string }) {
    return (
        <div
            className={`grid items-center gap-2 px-2 pb-1 font-semibold text-(--muted) text-[9px] uppercase [&>span:not(:first-child)]:text-right ${className}`}
        >
            {columns.map((column) => (
                <span key={column || 'spacer'}>{column}</span>
            ))}
        </div>
    );
}
