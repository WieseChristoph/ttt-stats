import { ArrowLeft, Crosshair, Skull, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import type { PlayerDetailsType } from '@/features/players/player-data';
import { Avatar } from '@/shared/components/ui/avatar';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { displayName, formatNumber } from '@/shared/utils/format';
import { PlayerRoundHistory } from './player-round-history';

export function PlayerDetails({ player }: { player: PlayerDetailsType }) {
    const { kills, deaths, wins, rounds } = player.totals;
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
            <div className="mb-7 grid grid-cols-2 gap-3 min-[850px]:grid-cols-4">
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
                    value={formatNumber(kills)}
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
            <PlayerRoundHistory rounds={player.rounds} />
        </div>
    );
}
