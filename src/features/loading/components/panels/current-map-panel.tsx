import { Activity, Clock3, Map as MapIcon, Skull, Trophy } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { getTeamPresentation } from '@/shared/team';
import { formatDuration, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/ui';
import styles from '../loading-screen.module.css';
import { LoadingMetric, PanelHeader, TeamPill } from '../loading-ui';

type CurrentMapPanelPropsType = {
    snapshot: Pick<LoadingSnapshotType, 'latestRound' | 'mapStats' | 'requestedMap'>;
};

export function CurrentMapPanel({ snapshot }: CurrentMapPanelPropsType) {
    const currentMapName = snapshot.requestedMap?.name ?? snapshot.latestRound.session.map.name;
    const currentMapStats = snapshot.requestedMap ? snapshot.requestedMap.stats : snapshot.mapStats;
    const latestWinner = getTeamPresentation(snapshot.latestRound.winningTeam);

    return (
        <section className={cn(styles.panel, styles.currentMapPanel)}>
            <PanelHeader
                icon={<MapIcon />}
                title="Current map"
                badge="Loading"
            />
            <div className={styles.currentMapContent}>
                <h1 className={styles.currentMapTitle}>{currentMapName}</h1>
            </div>
            <div className={styles.mapMetrics}>
                <LoadingMetric
                    icon={<Trophy />}
                    label="Rounds"
                    value={formatNumber(currentMapStats?.rounds)}
                />
                <LoadingMetric
                    icon={<Clock3 />}
                    label="Sessions"
                    value={formatNumber(currentMapStats?.sessions)}
                />
                <LoadingMetric
                    icon={<Activity />}
                    label="Avg round"
                    value={formatDuration(currentMapStats?.averageRoundDurationSeconds)}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths / round"
                    value={formatNumber(currentMapStats?.rounds ? currentMapStats.deaths / currentMapStats.rounds : 0)}
                />
            </div>
            <div className={styles.currentMapFooter}>
                <span className={styles.footerLabel}>
                    <Activity /> Latest result
                </span>
                <TeamPill team={latestWinner} />
            </div>
        </section>
    );
}
