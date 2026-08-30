import { Activity, Crosshair, Shield, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { displayName, formatNumber, labelize } from '@/shared/utils/format';
import { LoadingMetric, PanelHeader, PlayerAvatar, panelClassName } from '../loading-ui';

type PlayerStatsPanelPropsType = {
    player: LoadingSnapshotType['requestedPlayer'];
};

export function PlayerStatsPanel({ player }: PlayerStatsPanelPropsType) {
    const playerName = player ? displayName(player.username, player.steamId) : 'Player unavailable';

    return (
        <section className={`${panelClassName} col-span-1 xl:col-span-7`}>
            <PanelHeader
                icon={<Users />}
                title="Your stats"
            />
            {player ? (
                <PlayerStatsContent
                    player={player}
                    playerName={playerName}
                />
            ) : (
                <PlayerUnavailable />
            )}
        </section>
    );
}

function PlayerStatsContent({
    player,
    playerName,
}: {
    player: NonNullable<LoadingSnapshotType['requestedPlayer']>;
    playerName: string;
}) {
    return (
        <>
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(140px,0.65fr)_minmax(0,1.75fr)] items-center gap-4 xl:gap-7">
                <div className="flex min-w-0 items-center gap-3">
                    <PlayerAvatar
                        avatarUrl={player.avatarFull ?? player.avatarMedium}
                        name={playerName}
                    />
                    <h2 className="m-0 truncate font-black text-[clamp(1.4rem,2.1vw,2.7rem)] tracking-tighter">
                        {playerName}
                    </h2>
                </div>
                <div className="grid min-w-0 grid-cols-3 gap-2">
                    <LoadingMetric
                        icon={<Trophy />}
                        label="Wins"
                        value={formatNumber(player.wins)}
                    />
                    <LoadingMetric
                        icon={<Users />}
                        label="Rounds"
                        value={formatNumber(player.rounds)}
                    />
                    <LoadingMetric
                        icon={<Crosshair />}
                        label="Kills"
                        value={formatNumber(player.kills)}
                    />
                    <LoadingMetric
                        icon={<Skull />}
                        label="Deaths"
                        value={formatNumber(player.deaths)}
                    />
                    <LoadingMetric
                        icon={<Activity />}
                        label="K/D"
                        value={
                            player.deaths ? formatNumber(player.kills / player.deaths) : player.kills ? 'Perfect' : '—'
                        }
                    />
                    <LoadingMetric
                        icon={<Shield />}
                        label="Win rate"
                        value={player.rounds ? `${Math.round((player.wins / player.rounds) * 100)}%` : '—'}
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2 border-white/[0.07] border-t pt-3">
                <LoadingMetric
                    icon={<Crosshair />}
                    label="Headshots"
                    value={formatNumber(player.headshots)}
                />
                <LoadingMetric
                    icon={<Activity />}
                    label="Headshot rate"
                    value={player.kills ? `${Math.round((player.headshots / player.kills) * 100)}%` : '—'}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Teamkills"
                    value={formatNumber(player.teamKills)}
                />
                <LoadingMetric
                    icon={<Trophy />}
                    label="Favorite weapon"
                    value={formatWeaponName(player.favoriteWeapon)}
                    valueClassName="text-xl! tracking-tight!"
                />
            </div>
        </>
    );
}

function PlayerUnavailable() {
    return (
        <div className="grid flex-1 place-content-center justify-items-center gap-2 text-center text-slate-400">
            <Users className="size-7 text-violet-400" />
            <strong className="text-base text-slate-100">Player stats unavailable</strong>
            <span className="text-[13px]">No valid Steam ID was provided.</span>
        </div>
    );
}

function formatWeaponName(value: string | null): string {
    if (!value) {
        return '—';
    }

    return labelize(value.replace(/^weapon_/, ''));
}
