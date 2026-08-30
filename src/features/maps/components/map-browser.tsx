'use client';

import { ArrowUpRight, CalendarDays, Search, Skull, Swords, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { MapCardType } from '@/features/maps/map-data';
import { formatDate, formatNumber } from '@/shared/utils/format';

type MapSortType = 'recent' | 'rounds' | 'players' | 'deaths' | 'name';
type MapBrowserPropsType = { maps: MapCardType[] };

const sortOptions = [
    { value: 'recent', label: 'Recently played' },
    { value: 'rounds', label: 'Most rounds' },
    { value: 'players', label: 'Most players' },
    { value: 'deaths', label: 'Most deaths' },
    { value: 'name', label: 'Name' },
] satisfies Array<{ value: MapSortType; label: string }>;

export function MapBrowser({ maps }: MapBrowserPropsType) {
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<MapSortType>('recent');

    const visibleMaps = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return maps
            .filter((map) => map.name.toLocaleLowerCase().includes(normalizedQuery))
            .toSorted((left, right) => {
                if (sort === 'name') {
                    return left.name.localeCompare(right.name);
                }
                if (sort === 'rounds') {
                    return right.rounds - left.rounds;
                }
                if (sort === 'players') {
                    return right.players - left.players;
                }
                if (sort === 'deaths') {
                    return right.deaths - left.deaths;
                }
                return new Date(right.lastPlayed ?? 0).getTime() - new Date(left.lastPlayed ?? 0).getTime();
            });
    }, [maps, query, sort]);

    return (
        <>
            <MapBrowserToolbar
                query={query}
                sort={sort}
                onQueryChange={setQuery}
                onSortChange={setSort}
            />
            <p className="mb-3 text-slate-500 text-sm">{visibleMaps.length} maps</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleMaps.map((map) => (
                    <MapCard
                        map={map}
                        key={map.id}
                    />
                ))}
            </div>
            {!visibleMaps.length && (
                <p className="rounded-2xl border border-white/10 border-dashed p-12 text-center text-slate-500">
                    No maps match your search.
                </p>
            )}
        </>
    );
}

function MapBrowserToolbar({
    query,
    sort,
    onQueryChange,
    onSortChange,
}: {
    query: string;
    sort: MapSortType;
    onQueryChange: (query: string) => void;
    onSortChange: (sort: MapSortType) => void;
}) {
    return (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111722] p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0a0f17] px-3 text-slate-400 focus-within:border-violet-400">
                <Search className="size-4 shrink-0" />
                <input
                    className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Search maps"
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

function MapCard({ map }: { map: MapCardType }) {
    return (
        <Link
            className="group rounded-2xl border border-white/10 bg-[#111722] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-[#151c29]"
            href={`/maps/${encodeURIComponent(map.name)}`}
        >
            <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="truncate font-bold text-lg text-white">{map.name}</h2>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <CalendarDays className="size-3.5" /> Last played {formatDate(map.lastPlayed)}
                    </div>
                </div>
                <ArrowUpRight className="size-5 text-slate-600 transition group-hover:text-violet-300" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="rounded-xl bg-white/[0.035] p-3 text-slate-400">
                    <Swords className="mb-2 size-4 text-violet-400" />
                    <b className="mr-1 text-lg text-white">{formatNumber(map.rounds)}</b> rounds
                </span>
                <span className="rounded-xl bg-white/[0.035] p-3 text-slate-400">
                    <Users className="mb-2 size-4 text-violet-400" />
                    <b className="mr-1 text-lg text-white">{formatNumber(map.players)}</b> players
                </span>
                <span className="rounded-xl bg-white/[0.035] p-3 text-slate-400">
                    <CalendarDays className="mb-2 size-4 text-violet-400" />
                    <b className="mr-1 text-lg text-white">{formatNumber(map.sessions)}</b> sessions
                </span>
                <span className="rounded-xl bg-white/[0.035] p-3 text-slate-400">
                    <Skull className="mb-2 size-4 text-rose-400" />
                    <b className="mr-1 text-lg text-white">{formatNumber(map.deaths)}</b> deaths
                </span>
            </div>
        </Link>
    );
}
