import type { FullRoundType } from '@/features/rounds/round-data';
import type { ChartDatasetType } from '@/shared/components/ui/stats-chart';
import { HitGroupValues } from '@/shared/stats';
import { getTeamPresentation } from '@/shared/team';
import { formatRoundTime } from '@/shared/utils/format';

type PlayerStateType = { alive: boolean; connected: boolean; team: string };

type TimelineChangeType =
    | {
          kind: 'event';
          event: FullRoundType['events'][number];
          occurredAt: string | Date | null;
          timestamp: number | null;
          order: number;
      }
    | {
          kind: 'disconnect';
          playerId: number;
          occurredAt: string | Date;
          timestamp: number;
          order: number;
      };

export function getInRoundDisconnectTime(
    leftAt: string | Date | null | undefined,
    startedAt: string | Date,
    endedAt: string | Date,
): number | null {
    if (!leftAt) {
        return null;
    }

    const leftTime = new Date(leftAt).getTime();
    const startTime = new Date(startedAt).getTime();
    const endTime = new Date(endedAt).getTime();
    return Number.isFinite(leftTime) &&
        Number.isFinite(startTime) &&
        Number.isFinite(endTime) &&
        leftTime >= startTime &&
        leftTime < endTime
        ? leftTime
        : null;
}

export function getRoundCombat(round: FullRoundType) {
    const deaths = round.events.flatMap((event) => (event.death ? [event.death] : []));
    const enemyKills = round.players.reduce((total, player) => total + Math.max(0, player.kills - player.teamKills), 0);

    return {
        enemyKills,
        teamKills: round.players.reduce((total, player) => total + player.teamKills, 0),
        headshots: deaths.filter(
            (death) =>
                death.hitgroup === HitGroupValues.head &&
                !death.isTeamkill &&
                death.attacker !== null &&
                death.attacker.id !== death.victim.id,
        ).length,
        shotsFired: round.players.reduce((total, player) => total + (player.shotsFired ?? 0), 0),
        shotsHit: round.players.reduce((total, player) => total + (player.shotsHit ?? 0), 0),
        damage: round.players.reduce((total, player) => total + (player.damageDealt ?? 0), 0),
        hasTelemetry: round.players.some((player) => player.shotsFired !== null),
        roleChanges: round.events.filter((event) => event.type === 'role_change').length,
        revivals: round.events.filter((event) => event.type === 'revival').length,
    };
}

function createInitialPlayerState(round: FullRoundType) {
    return new Map(
        round.players.map((entry) => [
            entry.player.id,
            { alive: true, connected: true, team: entry.initialTeamName } satisfies PlayerStateType,
        ]),
    );
}

function getTimelineChanges(round: FullRoundType): TimelineChangeType[] {
    const roundStartTime = new Date(round.startedAt).getTime();
    const roundEndTime = new Date(round.endedAt).getTime();

    return [
        ...round.events.map((event) => {
            const parsedTimestamp = event.occurredAt ? new Date(event.occurredAt).getTime() : Number.NaN;
            const hasValidTimestamp =
                Number.isFinite(parsedTimestamp) &&
                Number.isFinite(roundStartTime) &&
                Number.isFinite(roundEndTime) &&
                parsedTimestamp >= roundStartTime &&
                parsedTimestamp <= roundEndTime;
            return {
                kind: 'event' as const,
                event,
                occurredAt: event.occurredAt,
                timestamp: hasValidTimestamp ? parsedTimestamp : null,
                order: event.sequence,
            };
        }),
        ...round.players.flatMap((player, index) => {
            const timestamp = getInRoundDisconnectTime(player.leftAt, round.startedAt, round.endedAt);
            return timestamp === null
                ? []
                : [
                      {
                          kind: 'disconnect' as const,
                          playerId: player.player.id,
                          occurredAt: player.leftAt as string | Date,
                          timestamp,
                          order: index,
                      },
                  ];
        }),
    ];
}

function applyTimelineChange(change: TimelineChangeType, playerState: Map<number, PlayerStateType>) {
    if (change.kind === 'disconnect') {
        const state = playerState.get(change.playerId);
        if (state) {
            state.alive = false;
            state.connected = false;
        }

        return;
    }

    if (change.event.death) {
        const state = playerState.get(change.event.death.victim.id);
        if (state) {
            state.alive = false;
        }
    } else if (change.event.revival) {
        const state = playerState.get(change.event.revival.player.id);
        if (state) {
            state.alive = state.connected;
            state.team = change.event.revival.teamName;
        } else {
            playerState.set(change.event.revival.player.id, {
                alive: true,
                connected: true,
                team: change.event.revival.teamName,
            });
        }
    } else if (change.event.roleChange) {
        const state = playerState.get(change.event.roleChange.player.id);
        if (state) {
            state.team = change.event.roleChange.toTeamName;
        }
    }
}

export function buildTeamScoreboard(round: FullRoundType) {
    const alive = new Map(round.players.map((entry) => [entry.player.id, true]));

    for (const event of round.events) {
        if (event.death) {
            alive.set(event.death.victim.id, false);
        } else if (event.revival) {
            alive.set(event.revival.player.id, true);
        }
    }

    for (const player of round.players) {
        if (getInRoundDisconnectTime(player.leftAt, round.startedAt, round.endedAt) !== null) {
            alive.set(player.player.id, false);
        }
    }

    const teams = new Map<
        string,
        {
            players: number;
            kills: number;
            deaths: number;
            teamKills: number;
            survivors: number;
            damage: number;
            shots: number;
            hits: number;
        }
    >();
    for (const player of round.players) {
        const current = teams.get(player.finalTeamName) ?? {
            players: 0,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            survivors: 0,
            damage: 0,
            shots: 0,
            hits: 0,
        };
        current.players += 1;
        current.kills += Math.max(0, player.kills - player.teamKills);
        current.deaths += player.deaths;
        current.teamKills += player.teamKills;
        current.survivors += alive.get(player.player.id) ? 1 : 0;
        current.damage += player.damageDealt ?? 0;
        current.shots += player.shotsFired ?? 0;
        current.hits += player.shotsHit ?? 0;
        teams.set(player.finalTeamName, current);
    }

    return [...teams].map(([team, stats]) => ({ team, stats }));
}

function getAliveAreaDatasets(values: Map<string, number[]>): ChartDatasetType[] {
    let cumulative: number[] = [];

    return [...values].map(([team, teamValues], index) => {
        cumulative = teamValues.map((value, valueIndex) => value + (cumulative[valueIndex] ?? 0));
        const presentation = getTeamPresentation(team);
        return {
            label: presentation.label,
            values: [...cumulative],
            tooltipValues: teamValues,
            colors: [presentation.color],
            stepped: true,
            fill: index === 0 ? 'origin' : '-1',
            pointRadius: 0,
        };
    });
}

export function buildAliveTimeline(round: FullRoundType) {
    const playerState = createInitialPlayerState(round);
    const allTeams = new Set(round.players.flatMap((entry) => [entry.initialTeamName, entry.finalTeamName]));
    const labels = ['0:00'];
    const values = new Map(
        [...allTeams].map((team) => [
            team,
            [round.players.filter((entry) => entry.initialTeamName === team).length] as number[],
        ]),
    );

    const pushState = (label: string) => {
        labels.push(label);
        for (const team of allTeams) {
            values
                .get(team)
                ?.push([...playerState.values()].filter((state) => state.alive && state.team === team).length);
        }
    };

    const ensureTeam = (team: string) => {
        allTeams.add(team);
        if (!values.has(team)) {
            values.set(team, Array(labels.length).fill(0));
        }
    };

    const changes = getTimelineChanges(round);
    const timedChanges = changes
        .filter((change): change is TimelineChangeType & { timestamp: number } => change.timestamp !== null)
        .toSorted(
            (left, right) =>
                left.timestamp - right.timestamp ||
                (left.kind === right.kind ? left.order - right.order : left.kind === 'event' ? -1 : 1),
        );
    const untimedChanges = changes
        .filter((change) => change.timestamp === null)
        .toSorted((left, right) => left.order - right.order);

    let changeIndex = 0;
    while (changeIndex < timedChanges.length) {
        const timestamp = timedChanges[changeIndex].timestamp;
        const occurredAt = timedChanges[changeIndex].occurredAt;

        do {
            const change = timedChanges[changeIndex];
            applyTimelineChange(change, playerState);

            if (change.kind === 'event' && change.event.revival) {
                ensureTeam(change.event.revival.teamName);
            } else if (change.kind === 'event' && change.event.roleChange) {
                ensureTeam(change.event.roleChange.toTeamName);
            }

            changeIndex += 1;
        } while (changeIndex < timedChanges.length && timedChanges[changeIndex].timestamp === timestamp);

        pushState(formatRoundTime(occurredAt, round.startedAt, round.endedAt));
    }

    if (untimedChanges.length) {
        for (const change of untimedChanges) {
            applyTimelineChange(change, playerState);
            if (change.kind === 'event' && change.event.revival) {
                ensureTeam(change.event.revival.teamName);
            } else if (change.kind === 'event' && change.event.roleChange) {
                ensureTeam(change.event.roleChange.toTeamName);
            }
        }

        pushState('Unknown time');
    }

    const roundEndTime = new Date(round.endedAt).getTime();
    const lastTimedChange = timedChanges.at(-1)?.timestamp;
    pushState(
        lastTimedChange === roundEndTime ? 'End' : formatRoundTime(round.endedAt, round.startedAt, round.endedAt),
    );

    return { labels, datasets: getAliveAreaDatasets(values), hasChanges: changes.length > 0 };
}

export function aggregateRoundWeapons(round: FullRoundType) {
    const weapons = new Map<string, { kills: number; users: number; shots: number; hits: number; damage: number }>();
    for (const player of round.players) {
        for (const weapon of player.weapons) {
            const current = weapons.get(weapon.weaponName) ?? { kills: 0, users: 0, shots: 0, hits: 0, damage: 0 };
            current.kills += weapon.kills;
            current.users += 1;
            current.shots += weapon.shotsFired ?? 0;
            current.hits += weapon.shotsHit ?? 0;
            current.damage += weapon.damageDealt ?? 0;
            weapons.set(weapon.weaponName, current);
        }
    }

    return [...weapons]
        .map(([weapon, stats]) => ({ weapon, stats }))
        .toSorted((left, right) => right.stats.kills - left.stats.kills);
}

export type RoundCombatType = ReturnType<typeof getRoundCombat>;
