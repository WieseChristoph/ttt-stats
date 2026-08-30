import Image from 'next/image';
import type { ReactNode } from 'react';
import type { TeamPresentationType } from '@/shared/team';
import { cn, initials } from '@/shared/utils/ui';
import styles from './loading-screen.module.css';

type LoadingMetricPropsType = {
    icon: ReactNode;
    label: string;
    value: string;
    valueClassName?: string;
};

export function PanelHeader({ icon, title, badge }: { icon: ReactNode; title: string; badge?: string }) {
    return (
        <div className={styles.panelHeaderRow}>
            <div className={styles.panelHeaderTitle}>
                {icon}
                {title}
            </div>
            {badge && <span className={styles.badge}>{badge}</span>}
        </div>
    );
}

export function LoadingMetric({ icon, label, value, valueClassName }: LoadingMetricPropsType) {
    return (
        <div className={styles.metric}>
            <div className={styles.metricLabel}>
                {icon}
                <span className={styles.truncate}>{label}</span>
            </div>
            <strong className={cn(styles.metricValue, valueClassName)}>{value}</strong>
        </div>
    );
}

export function PlayerAvatar({ avatarUrl, name }: { avatarUrl: string | null | undefined; name: string }) {
    return avatarUrl ? (
        <Image
            className={styles.avatar}
            src={avatarUrl}
            alt={name}
            width={80}
            height={80}
        />
    ) : (
        <span
            className={styles.avatarFallback}
            role="img"
            aria-label={name}
        >
            {initials(name)}
        </span>
    );
}

export function TeamPill({ team }: { team: TeamPresentationType }) {
    return (
        <span
            className={styles.teamPill}
            style={{ color: team.color, backgroundColor: team.softColor }}
        >
            <span
                className={styles.teamDot}
                style={{ backgroundColor: team.color }}
            />
            {team.label}
        </span>
    );
}
