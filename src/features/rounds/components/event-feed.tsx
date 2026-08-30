import { HeartPulse, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FullRoundType } from '@/features/rounds/round-data';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { getRolePresentation, getTeamPresentation } from '@/shared/team';
import { displayName, formatRoundTime, labelize } from '@/shared/utils/format';
import { cn } from '@/shared/utils/ui';

type EventFeedPropsType = {
    round: FullRoundType;
};

type RoundEventType = FullRoundType['events'][number];

export function EventFeed({ round }: EventFeedPropsType) {
    return (
        <section className="min-w-0 rounded-2xl border border-(--line) bg-[linear-gradient(145deg,rgba(23,29,42,0.96),rgba(18,23,34,0.92))] p-6 max-[559px]:p-4.25">
            <SectionHeading title="Event feed" />
            {round.events.length ? (
                <div className="grid max-h-127.5 gap-0 overflow-y-auto">
                    {round.events.map((event, index) => (
                        <EventFeedItem
                            event={event}
                            isFirst={index === 0}
                            isLast={index === round.events.length - 1}
                            roundEndedAt={round.endedAt}
                            roundStartedAt={round.startedAt}
                            key={event.id}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No events recorded"
                    message="No deaths, role changes, or revivals were recorded in this round."
                />
            )}
        </section>
    );
}

function EventFeedItem({
    event,
    isFirst,
    isLast,
    roundEndedAt,
    roundStartedAt,
}: {
    event: RoundEventType;
    isFirst: boolean;
    isLast: boolean;
    roundEndedAt: string;
    roundStartedAt: string;
}) {
    let content: ReactNode = null;
    if (event.type === 'death' && event.death) {
        content = <DeathEvent death={event.death} />;
    } else if (event.type === 'role_change' && event.roleChange) {
        content = <RoleChangeEvent roleChange={event.roleChange} />;
    } else if (event.type === 'revival' && event.revival) {
        content = <RevivalEvent revival={event.revival} />;
    }

    if (!content) {
        return null;
    }

    return (
        <div className="group grid grid-cols-[56px_minmax(0,1fr)] gap-3 py-1.25 text-xs">
            <span
                className={cn(
                    "relative grid place-items-center self-stretch text-(--purple) before:absolute before:left-1/2 before:w-px before:bg-(--line) before:content-['']",
                    isFirst ? 'before:top-1/2' : 'before:-top-1.25',
                    isLast ? 'before:bottom-1/2' : 'before:-bottom-1.25',
                )}
            >
                <time className="relative z-1 inline-flex min-h-6 min-w-11 items-center justify-center rounded-full border border-[rgba(157,140,255,0.4)] bg-(--panel-raised) px-1.75 py-0.75 font-bold text-(--purple) text-[10px] tabular-nums">
                    {formatRoundTime(event.occurredAt, roundStartedAt, roundEndedAt)}
                </time>
            </span>
            {content}
        </div>
    );
}

function DeathEvent({ death }: { death: NonNullable<RoundEventType['death']> }) {
    const attackerPresentation = getRolePresentation(death.attackerSubroleName, death.attackerTeamName);
    const victimPresentation = getRolePresentation(death.victimSubroleName, death.victimTeamName);

    return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(130px,auto)] items-center gap-3 rounded-[10px] border border-(--line) bg-white/[0.018] px-3 py-2.5 max-[559px]:grid-cols-1">
            <span className="flex min-w-0 items-baseline gap-2">
                <strong
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold"
                    style={{ color: attackerPresentation.color }}
                >
                    {death.attacker ? displayName(death.attacker.username, death.attacker.steamId) : 'The world'}
                </strong>
                <span className="shrink-0 text-(--muted) text-[9px] uppercase">killed</span>
                <strong
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold"
                    style={{ color: victimPresentation.color }}
                >
                    {displayName(death.victim.username, death.victim.steamId)}
                </strong>
            </span>
            <small className="flex min-w-0 items-center justify-end gap-1.75 overflow-hidden text-ellipsis whitespace-nowrap text-right text-(--muted) text-[10px] max-[559px]:justify-start max-[559px]:text-left">
                {death.isTeamkill ? (
                    <span className="shrink-0 rounded-full bg-[rgba(255,102,117,0.14)] px-1.5 py-0.75 font-bold text-(--red) text-[9px] uppercase tracking-[0.04em]">
                        Team kill
                    </span>
                ) : null}
                {death.hitgroup === 1 ? (
                    <span className="shrink-0 rounded-full bg-[rgba(255,200,87,0.14)] px-1.5 py-0.75 font-bold text-(--amber) text-[9px] uppercase tracking-[0.04em]">
                        Headshot
                    </span>
                ) : null}
                <span className="overflow-hidden text-ellipsis">{death.inflictor ?? 'unknown cause'}</span>
            </small>
        </div>
    );
}

function RoleChangeEvent({ roleChange }: { roleChange: NonNullable<RoundEventType['roleChange']> }) {
    return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-[rgba(157,140,255,0.24)] bg-[rgba(157,140,255,0.045)] px-3 py-2.5 max-[700px]:grid-cols-1">
            <span className="flex min-w-0 items-center gap-2">
                <RefreshCw className="size-3.5 shrink-0 text-(--purple)" />
                <strong className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {displayName(roleChange.player.username, roleChange.player.steamId)}
                </strong>
                <span className="shrink-0 text-(--muted) text-[9px] uppercase">changed role</span>
            </span>
            <div className="flex min-w-0 items-center justify-end gap-2 max-[700px]:justify-start">
                <RoleState
                    subroleName={roleChange.fromSubroleName}
                    teamName={roleChange.fromTeamName}
                />
                <span className="text-(--muted)">→</span>
                <RoleState
                    subroleName={roleChange.toSubroleName}
                    teamName={roleChange.toTeamName}
                />
            </div>
        </div>
    );
}

function RevivalEvent({ revival }: { revival: NonNullable<RoundEventType['revival']> }) {
    const role = getRolePresentation(revival.subroleName, revival.teamName);

    return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-[rgba(99,212,113,0.25)] bg-[rgba(99,212,113,0.045)] px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2">
                <HeartPulse className="size-3.75 shrink-0 text-(--green)" />
                <strong className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {displayName(revival.player.username, revival.player.steamId)}
                </strong>
                <span className="shrink-0 text-(--muted) text-[9px] uppercase">was revived</span>
            </span>
            <span
                className="shrink-0 rounded-full px-2 py-1 font-bold text-[9px] uppercase tracking-[0.04em]"
                style={{ backgroundColor: role.softColor, color: role.color }}
            >
                {roleLabel(revival.subroleName, revival.teamName)}
            </span>
        </div>
    );
}

function RoleState({ subroleName, teamName }: { subroleName: string | null; teamName: string }) {
    const role = getRolePresentation(subroleName, teamName);

    return (
        <span
            className="max-w-42 overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2 py-1 font-bold text-[9px] uppercase tracking-[0.04em]"
            style={{ backgroundColor: role.softColor, color: role.color }}
        >
            {roleLabel(subroleName, teamName)}
        </span>
    );
}

function roleLabel(subroleName: string | null, teamName: string): string {
    const teamLabel = getTeamPresentation(teamName).label;
    if (!subroleName) {
        return teamLabel;
    }

    const subroleLabel = labelize(subroleName);
    return subroleLabel.toLocaleLowerCase() === teamLabel.replace(/s$/, '').toLocaleLowerCase()
        ? subroleLabel
        : `${subroleLabel} · ${teamLabel}`;
}
