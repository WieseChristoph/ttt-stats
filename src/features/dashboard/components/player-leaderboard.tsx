import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { DashboardDataType } from '@/features/dashboard/dashboard-data';
import { Avatar } from '@/shared/components/ui/avatar';
import { displayName, formatNumber } from '@/shared/utils/format';

type PlayerLeaderboardPropsType = { players: DashboardDataType['topPlayers'] };

export function PlayerLeaderboard({ players }: PlayerLeaderboardPropsType) {
    return (
        <div className="grid content-start gap-1.5">
            {players.map((player, index) => (
                <LeaderboardRow
                    index={index}
                    player={player}
                    key={player.steamId}
                />
            ))}
        </div>
    );
}

function LeaderboardRow({ index, player }: { index: number; player: DashboardDataType['topPlayers'][number] }) {
    const killDeathRatio = player.deaths === 0 ? player.kills : player.kills / player.deaths;
    const winRate = player.rounds === 0 ? 0 : (player.wins / player.rounds) * 100;

    return (
        <Link
            className="group grid min-w-0 grid-cols-[24px_34px_minmax(120px,1fr)_repeat(3,minmax(58px,74px))_16px] items-center gap-x-2.5 rounded-[10px] px-2.25 py-2 hover:bg-white/4.5 max-[700px]:grid-cols-[20px_34px_minmax(0,1fr)_58px_16px]"
            href={`/players/${player.steamId}`}
        >
            <b className="w-5.5 text-(--muted) text-[11px]">{String(index + 1).padStart(2, '0')}</b>
            <Avatar
                name={player.username}
                src={player.avatarMedium}
                steamId={player.steamId}
                size="small"
            />
            <span className="grid min-w-0 gap-0.75">
                <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px]">
                    {displayName(player.username, player.steamId)}
                </strong>
                <small className="text-(--muted) text-[10px]">{formatNumber(player.rounds)} rounds</small>
            </span>
            <span className="grid content-center gap-0.5 max-[700px]:hidden">
                <strong className="text-(--text) text-[13px]">{killDeathRatio.toFixed(1)}</strong>
                <small className="text-(--muted) text-[9px] uppercase">K/D</small>
            </span>
            <span className="grid content-center gap-0.5 max-[700px]:hidden">
                <strong className="text-(--text) text-[13px]">{Math.round(winRate)}%</strong>
                <small className="text-(--muted) text-[9px] uppercase">Win rate</small>
            </span>
            <span className="grid content-center gap-0.5 text-right">
                <strong className="text-(--amber) text-[15px]">{formatNumber(player.kills)}</strong>
                <small className="text-(--muted) text-[9px] uppercase">Kills</small>
            </span>
            <ArrowUpRight className="w-3.75 text-(--muted)" />
        </Link>
    );
}
