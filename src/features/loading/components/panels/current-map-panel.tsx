import { Activity, Clock3, Map as MapIcon, Skull, Trophy, Users } from 'lucide-react';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { getTeamPresentation } from '@/shared/team';
import { formatNumber } from '@/shared/utils/format';
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
                    icon={<Users />}
                    label="Players"
                    value={formatNumber(currentMapStats?.players)}
                />
                <LoadingMetric
                    icon={<Skull />}
                    label="Deaths"
                    value={formatNumber(currentMapStats?.deaths)}
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
