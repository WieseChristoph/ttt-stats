import dayjs from 'dayjs';

export function formatDate(value: string | Date | null | undefined): string {
    if (!value) {
        return 'Unknown date';
    }

    return dayjs(value).format('DD MMM YYYY, HH:mm');
}

export function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
        return '—';
    }

    const rounded = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(rounded / 60);
    const remainingSeconds = rounded % 60;

    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

export function formatRoundTime(
    occurredAt: string | Date | null | undefined,
    roundStartedAt: string | Date,
    roundEndedAt: string | Date,
): string {
    if (!occurredAt) {
        return '—';
    }

    const occurredAtTime = new Date(occurredAt).getTime();
    const roundStartedAtTime = new Date(roundStartedAt).getTime();
    const roundEndedAtTime = new Date(roundEndedAt).getTime();
    if (
        !Number.isFinite(occurredAtTime) ||
        !Number.isFinite(roundStartedAtTime) ||
        !Number.isFinite(roundEndedAtTime) ||
        occurredAtTime < roundStartedAtTime ||
        occurredAtTime > roundEndedAtTime ||
        roundEndedAtTime < roundStartedAtTime
    ) {
        return '—';
    }

    const elapsedSeconds = (occurredAtTime - roundStartedAtTime) / 1000;
    const roundedSeconds = Math.max(0, Math.round(elapsedSeconds));
    const minutes = Math.floor(roundedSeconds / 60);
    const seconds = roundedSeconds % 60;

    return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
}

export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

export function formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${Math.round(value)}%`;
}

export function displayName(username: string | null | undefined, steamId: string): string {
    return username?.trim() || `Player ${steamId.slice(-4)}`;
}

export function labelize(value: string | null | undefined): string {
    if (!value) {
        return 'Unknown';
    }

    return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
