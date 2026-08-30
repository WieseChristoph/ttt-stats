import { Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { LoadingSnapshotType } from '@/features/loading/loading-data';
import { formatDate } from '@/shared/utils/format';
import { LoadingCanvas } from './loading-canvas';
import styles from './loading-screen.module.css';
import { CurrentMapPanel } from './panels/current-map-panel';
import { LastRoundPanel } from './panels/last-round-panel';
import { OverallStatsPanel } from './panels/overall-stats-panel';
import { PlayerStatsPanel } from './panels/player-stats-panel';

type LoadingScreenPropsType = {
    snapshot: LoadingSnapshotType | null;
};

export function LoadingScreen({ snapshot }: LoadingScreenPropsType) {
    if (!snapshot) {
        return <NoRoundsState />;
    }

    const currentMapName = snapshot.requestedMap?.name ?? snapshot.latestRound.session.map.name;

    return (
        <div className={styles.screen}>
            <div className={styles.screenBackground} />
            <LoadingCanvas>
                <LoadingHeader
                    currentMapName={currentMapName}
                    latestRoundEndedAt={snapshot.latestRound.endedAt}
                />
                <div className={styles.panelGrid}>
                    <CurrentMapPanel snapshot={snapshot} />
                    <PlayerStatsPanel player={snapshot.requestedPlayer} />
                    <OverallStatsPanel snapshot={snapshot} />
                    <LastRoundPanel snapshot={snapshot} />
                </div>
            </LoadingCanvas>
        </div>
    );
}

function NoRoundsState() {
    return (
        <div className={styles.emptyScreen}>
            <div className={styles.emptyCard}>
                <Trophy className={styles.emptyIcon} />
                <h1 className={styles.emptyTitle}>No rounds recorded yet</h1>
                <p className={styles.emptyText}>Stats will appear after the first completed round.</p>
            </div>
        </div>
    );
}

function LoadingHeader({ currentMapName, latestRoundEndedAt }: { currentMapName: string; latestRoundEndedAt: string }) {
    return (
        <header className={styles.header}>
            <Link
                className={styles.brand}
                href="/"
            >
                <Image
                    className={styles.brandImage}
                    src="/ttt.png"
                    alt="TTT Stats"
                    width={32}
                    height={32}
                    priority
                />
                <div className={styles.brandName}>
                    <span className={styles.brandAccent}>TTT</span> Stats
                </div>
            </Link>
            <div className={styles.connection}>
                <span className={styles.connectionDot} />
                <span className={styles.truncate}>Connecting to {currentMapName}</span>
                <span className={`${styles.connectionDetail} ${styles.connectionSeparator}`}>•</span>
                <span className={styles.connectionDetail}>{formatDate(latestRoundEndedAt)}</span>
            </div>
        </header>
    );
}
