import { Activity, Crosshair, Shield, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { displayName, formatNumber, labelize } from '@/shared/utils/format';
import styles from '../loading-screen.module.css';
import { LoadingMetric, PanelHeader, PlayerAvatar } from '../loading-ui';

type PlayerStatsPanelPropsType = {
    player: LoadingSnapshotType['requestedPlayer'];
};

export function PlayerStatsPanel({ player }: PlayerStatsPanelPropsType) {
    const playerName = player ? displayName(player.username, player.steamId) : 'Player unavailable';

    return (
        <section className={`${styles.panel} ${styles.playerStatsPanel}`}>
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
            <div className={styles.playerContent}>
                <div className={styles.playerIdentity}>
                    <PlayerAvatar
                        avatarUrl={player.avatarFull ?? player.avatarMedium}
                        name={playerName}
                    />
                    <h2 className={styles.playerName}>{playerName}</h2>
                </div>
                <div className={styles.playerMetrics}>
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
            <div className={styles.playerExtras}>
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
                    valueClassName={styles.weaponMetricValue}
                />
            </div>
        </>
    );
}

function PlayerUnavailable() {
    return (
        <div className={styles.playerUnavailable}>
            <Users />
            <strong>Player stats unavailable</strong>
            <span>No valid Steam ID was provided.</span>
        </div>
    );
}

function formatWeaponName(value: string | null): string {
    if (!value) {
        return '—';
    }

    return labelize(value.replace(/^weapon_/, ''));
}
