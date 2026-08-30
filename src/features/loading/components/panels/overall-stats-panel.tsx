import { Activity, Clock3, Map as MapIcon, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { getTeamPresentation } from '@/shared/team';
import { formatNumber } from '@/shared/utils/format';
import styles from '../loading-screen.module.css';
import { LoadingMetric, PanelHeader } from '../loading-ui';

type OverallStatsPanelPropsType = {
    snapshot: Pick<LoadingSnapshotType, 'globalStats' | 'teamWins'>;
};

export function OverallStatsPanel({ snapshot }: OverallStatsPanelPropsType) {
    const visibleTeamWins = snapshot.teamWins.slice(0, 5);
    const highestTeamWins = Math.max(...visibleTeamWins.map((entry) => entry.wins), 1);

    return (
        <section className={`${styles.panel} ${styles.overallStatsPanel}`}>
            <PanelHeader
                icon={<Activity />}
                title="Overall stats"
            />
            <div className={styles.overallMetrics}>
                <LoadingMetric
                    icon={<Trophy />}
                    label="Rounds"
                    value={formatNumber(snapshot.globalStats.rounds)}
                />
                <LoadingMetric
                    icon={<MapIcon />}
                    label="Maps"
                    value={formatNumber(snapshot.globalStats.maps)}
                />
                <LoadingMetric
                    icon={<Users />}
                    label="Players"
                    value={formatNumber(snapshot.globalStats.players)}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths"
                    value={formatNumber(snapshot.globalStats.deaths)}
                />
                <LoadingMetric
                    icon={<Clock3 />}
                    label="Sessions"
                    value={formatNumber(snapshot.globalStats.sessions)}
                />
                <LoadingMetric
                    icon={<Users />}
                    label="Player rounds"
                    value={formatNumber(snapshot.globalStats.playerRounds)}
                />
                <LoadingMetric
                    icon={<Activity />}
                    label="Avg players"
                    value={formatNumber(
                        snapshot.globalStats.rounds
                            ? snapshot.globalStats.playerRounds / snapshot.globalStats.rounds
                            : 0,
                    )}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths / round"
                    value={formatNumber(
                        snapshot.globalStats.rounds ? snapshot.globalStats.deaths / snapshot.globalStats.rounds : 0,
                    )}
                />
            </div>
            <div className={styles.roundWins}>
                <div className={styles.sectionLabel}>Round wins</div>
                {visibleTeamWins.map((entry) => (
                    <TeamWinRow
                        entry={entry}
                        highestTeamWins={highestTeamWins}
                        key={entry.team}
                    />
                ))}
            </div>
        </section>
    );
}

function TeamWinRow({
    entry,
    highestTeamWins,
}: {
    entry: LoadingSnapshotType['teamWins'][number];
    highestTeamWins: number;
}) {
    const team = getTeamPresentation(entry.team);

    return (
        <div className={styles.teamWinRow}>
            <span className={styles.teamName}>{team.label}</span>
            <span className={styles.teamBar}>
                <span
                    className={styles.teamBarFill}
                    style={{ width: `${(entry.wins / highestTeamWins) * 100}%`, backgroundColor: team.color }}
                />
            </span>
            <strong className={styles.teamWins}>{formatNumber(entry.wins)}</strong>
        </div>
    );
}
