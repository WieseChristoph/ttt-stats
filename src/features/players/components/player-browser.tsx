'use client';

import { ArrowUpRight, Crosshair, Search, ShieldCheck, Skull, Swords, Target } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PlayerCardType } from '@/features/players/player-data';
import { Avatar } from '@/shared/components/ui/avatar';
import { AccuracyQualificationShots, enemyKills, percentage } from '@/shared/stats';
import { displayName, formatNumber, formatPercentage } from '@/shared/utils/format';

type PlayerSortType = 'kills' | 'wins' | 'rounds' | 'ratio' | 'headshots' | 'accuracy' | 'damage' | 'recent' | 'name';
type PlayerBrowserPropsType = { players: PlayerCardType[] };

const sortOptions = [
    { value: 'kills', label: 'Kills' },
    { value: 'wins', label: 'Wins' },
    { value: 'rounds', label: 'Rounds' },
    { value: 'ratio', label: 'K/D' },
    { value: 'headshots', label: 'Headshots' },
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'damage', label: 'Damage' },
    { value: 'recent', label: 'Recent' },
    { value: 'name', label: 'Name' },
] satisfies Array<{ value: PlayerSortType; label: string }>;

const ratio = (kills: number, deaths: number) => (deaths === 0 ? kills : kills / deaths);

export function PlayerBrowser({ players }: PlayerBrowserPropsType) {
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<PlayerSortType>('kills');
    const [minimumRounds, setMinimumRounds] = useState(0);

    const visiblePlayers = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return players
            .filter(
                (player) =>
                    player.rounds >= minimumRounds &&
                    `${player.username ?? ''} ${player.steamId}`.toLocaleLowerCase().includes(normalizedQuery),
            )
            .toSorted((left, right) => {
                if (sort === 'name') {
                    return displayName(left.username, left.steamId).localeCompare(
                        displayName(right.username, right.steamId),
                    );
                }
                if (sort === 'wins') {
                    return right.wins - left.wins;
                }
                if (sort === 'rounds') {
                    return right.rounds - left.rounds;
                }
                if (sort === 'ratio') {
                    return (
                        ratio(enemyKills(right.kills, right.teamKills), right.deaths) -
                        ratio(enemyKills(left.kills, left.teamKills), left.deaths)
                    );
                }
                if (sort === 'headshots') {
                    return right.headshots - left.headshots;
                }
                if (sort === 'accuracy') {
                    const rightAccuracy =
                        (right.shotsFired ?? 0) >= AccuracyQualificationShots
                            ? (right.shotsHit ?? 0) / (right.shotsFired ?? 1)
                            : -1;
                    const leftAccuracy =
                        (left.shotsFired ?? 0) >= AccuracyQualificationShots
                            ? (left.shotsHit ?? 0) / (left.shotsFired ?? 1)
                            : -1;
                    return rightAccuracy - leftAccuracy;
                }
                if (sort === 'damage') {
                    return (
                        Number(right.damageDealt ?? 0) / Math.max(right.telemetryRounds, 1) -
                        Number(left.damageDealt ?? 0) / Math.max(left.telemetryRounds, 1)
                    );
                }
                if (sort === 'recent') {
                    return new Date(right.lastPlayed ?? 0).getTime() - new Date(left.lastPlayed ?? 0).getTime();
                }
                return enemyKills(right.kills, right.teamKills) - enemyKills(left.kills, left.teamKills);
            });
    }, [minimumRounds, players, query, sort]);

    return (
        <>
            <PlayerBrowserToolbar
                query={query}
                sort={sort}
                onQueryChange={setQuery}
                onSortChange={setSort}
            />
            <p className="mb-3 text-slate-500 text-sm">{visiblePlayers.length} players</p>
            <div className="mb-4 flex items-center gap-2 text-slate-500 text-xs">
                <span>Minimum rounds</span>
                {[0, 10, 25, 50].map((value) => (
                    <button
                        className={`rounded-lg px-2.5 py-1.5 ${minimumRounds === value ? 'bg-violet-500 text-white' : 'bg-white/5 hover:text-white'}`}
                        key={value}
                        onClick={() => setMinimumRounds(value)}
                        type="button"
                    >
                        {value || 'All'}
                    </button>
                ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visiblePlayers.map((player) => (
                    <PlayerCard
                        player={player}
                        key={player.steamId}
                    />
                ))}
            </div>
            {!visiblePlayers.length && (
                <p className="rounded-2xl border border-white/10 border-dashed p-12 text-center text-slate-500">
                    No players match your search.
                </p>
            )}
        </>
    );
}

function PlayerBrowserToolbar({
    query,
    sort,
    onQueryChange,
    onSortChange,
}: {
    query: string;
    sort: PlayerSortType;
    onQueryChange: (query: string) => void;
    onSortChange: (sort: PlayerSortType) => void;
}) {
    return (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111722] p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0a0f17] px-3 text-slate-400 focus-within:border-violet-400">
                <Search className="size-4 shrink-0" />
                <input
                    className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Search name or Steam ID"
                    type="search"
                    value={query}
                />
            </label>
            <div className="flex flex-wrap gap-1">
                {sortOptions.map((option) => (
                    <button
                        className={`rounded-lg px-3 py-2 font-semibold text-xs transition ${sort === option.value ? 'bg-violet-500 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        type="button"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function PlayerCard({ player }: { player: PlayerCardType }) {
    const winRate = player.rounds ? Math.round((player.wins / player.rounds) * 100) : 0;
    const combatKills = enemyKills(player.kills, player.teamKills);
    const accuracy = percentage(Number(player.shotsHit ?? 0), Number(player.shotsFired ?? 0));
    const headshotRate = percentage(player.headshots, player.headshotEligibleKills);

    return (
        <Link
            className="group rounded-2xl border border-white/10 bg-[#111722] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-[#151c29]"
            href={`/players/${player.steamId}`}
        >
            <div className="mb-5 flex items-center gap-3">
                <Avatar
                    name={player.username}
                    src={player.avatarMedium}
                    steamId={player.steamId}
                    size="medium"
                />
                <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-lg text-white">
                        {displayName(player.username, player.steamId)}
                    </h2>
                    <p className="truncate text-slate-500 text-xs">{player.steamId}</p>
                </div>
                <ArrowUpRight className="size-5 text-slate-600 transition group-hover:text-violet-300" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <span className="rounded-xl bg-white/[0.035] p-2 text-slate-500 text-xs">
                    <Swords className="mx-auto mb-1 size-4 text-violet-400" />
                    <b className="block text-base text-white">{formatNumber(player.rounds)}</b>
                    Rounds
                </span>
                <span className="rounded-xl bg-white/[0.035] p-2 text-slate-500 text-xs">
                    <Crosshair className="mx-auto mb-1 size-4 text-violet-400" />
                    <b className="block text-base text-white">{formatNumber(combatKills)}</b>
                    Enemy kills
                </span>
                <span className="rounded-xl bg-white/[0.035] p-2 text-slate-500 text-xs">
                    <Skull className="mx-auto mb-1 size-4 text-rose-400" />
                    <b className="block text-base text-white">{ratio(combatKills, player.deaths).toFixed(1)}</b>
                    K/D
                </span>
                <span className="rounded-xl bg-white/[0.035] p-2 text-slate-500 text-xs">
                    <ShieldCheck className="mx-auto mb-1 size-4 text-emerald-400" />
                    <b className="block text-base text-white">{winRate}%</b>Wins
                </span>
                <span className="rounded-xl bg-white/[0.035] p-2 text-slate-500 text-xs">
                    <Target className="mx-auto mb-1 size-4 text-emerald-400" />
                    <b className="block text-base text-white">{formatPercentage(headshotRate)}</b>Headshots
                </span>
                <span className="rounded-xl bg-white/[0.035] p-2 text-slate-500 text-xs">
                    <Crosshair className="mx-auto mb-1 size-4 text-violet-400" />
                    <b className="block text-base text-white">{formatPercentage(accuracy)}</b>Accuracy
                </span>
            </div>
        </Link>
    );
}
