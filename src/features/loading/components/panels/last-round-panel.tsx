import { Clock3, Crosshair, Map as MapIcon, Shield, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { getTeamPresentation } from '@/shared/team';
import { formatDate, formatDuration, formatNumber } from '@/shared/utils/format';
import styles from '../loading-screen.module.css';
import { LoadingMetric, PanelHeader, TeamPill } from '../loading-ui';

type LastRoundPanelPropsType = {
    snapshot: Pick<LoadingSnapshotType, 'latestRound' | 'recentRounds'>;
};

export function LastRoundPanel({ snapshot }: LastRoundPanelPropsType) {
    const latestWinner = getTeamPresentation(snapshot.latestRound.winningTeam);
    const latestDuration = Math.max(
        0,
        (new Date(snapshot.latestRound.endedAt).getTime() - new Date(snapshot.latestRound.startedAt).getTime()) / 1000,
    );
    const latestSurvivors = snapshot.latestRound.players.filter((player) => player.deaths === 0).length;
    const latestKills = snapshot.latestRound.players.reduce((total, player) => total + player.kills, 0);
    const latestDeaths = snapshot.latestRound.players.reduce((total, player) => total + player.deaths, 0);

    return (
        <section className={`${styles.panel} ${styles.lastRoundPanel}`}>
            <div className={styles.lastRoundHeader}>
                <div>
                    <PanelHeader
                        icon={<Trophy />}
                        title="Last round"
                    />
                    <h2 className={styles.lastRoundTitle}>{latestWinner.label} victory</h2>
                </div>
                <div className={styles.lastRoundResult}>
                    <TeamPill team={latestWinner} />
                    <span className={styles.lastRoundDate}>{formatDate(snapshot.latestRound.endedAt)}</span>
                </div>
            </div>
            <div className={styles.lastRoundMetrics}>
                <LoadingMetric
                    icon={<MapIcon />}
                    label="Map"
                    value={snapshot.latestRound.session.map.name}
                    valueClassName={styles.compactMetricValue}
                />
                <LoadingMetric
                    icon={<Clock3 />}
                    label="Duration"
                    value={formatDuration(latestDuration)}
                />
                <LoadingMetric
                    icon={<Users />}
                    label="Players"
                    value={formatNumber(snapshot.latestRound.players.length)}
                />
                <LoadingMetric
                    icon={<Shield />}
                    label="Survivors"
                    value={formatNumber(latestSurvivors)}
                />
                <LoadingMetric
                    icon={<Crosshair />}
                    label="Kills"
                    value={formatNumber(latestKills)}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths"
                    value={formatNumber(latestDeaths)}
                />
            </div>
            <div className={styles.recentResults}>
                <div className={styles.sectionLabel}>Recent results</div>
                <div className={styles.recentRounds}>
                    {snapshot.recentRounds.map((round) => (
                        <RecentRoundCard
                            round={round}
                            key={round.id}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function RecentRoundCard({ round }: { round: LoadingSnapshotType['recentRounds'][number] }) {
    const winner = getTeamPresentation(round.winningTeam);
    const duration = Math.max(0, (new Date(round.endedAt).getTime() - new Date(round.startedAt).getTime()) / 1000);

    return (
        <div className={styles.recentRoundCard}>
            <strong className={styles.recentRoundMap}>{round.mapName}</strong>
            <div className={styles.recentRoundDetails}>
                <span
                    className={styles.recentRoundWinner}
                    style={{ color: winner.color }}
                >
                    <span
                        className={styles.smallTeamDot}
                        style={{ backgroundColor: winner.color }}
                    />
                    {winner.label}
                </span>
                <span className={styles.recentRoundMeta}>
                    {round.playerCount}p · {formatDuration(duration)}
                </span>
            </div>
        </div>
    );
}
