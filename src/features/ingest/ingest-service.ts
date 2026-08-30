import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import {
    statsDeath,
    statsMap,
    statsPlayer,
    statsRevival,
    statsRoleChange,
    statsRound,
    statsRoundEvent,
    statsRoundPlayer,
    statsSession,
    statsWeaponStat,
} from '@/db/schema';
import { TeamValues } from '@/shared/team';
import type { IngestDeathEventType, IngestRoundType, IngestSessionType } from './ingest-contracts';

type IngestTransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

type SessionIdentityType = {
    mapId: number;
    sessionKey: string;
    startedAt: string;
};

type RoundResolutionType = {
    id: number;
    created: boolean;
};

type PlayerAggregateType = {
    kills: number;
    deaths: number;
    teamKills: number;
    weaponKills: Map<string, number>;
};

export class IngestConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IngestConflictError';
    }
}

function requireId(id: number | undefined, description: string): number {
    if (id === undefined) {
        throw new Error(`${description} could not be resolved`);
    }

    return id;
}

async function getMapId(tx: IngestTransactionType, mapName: string): Promise<number> {
    const inserted = await tx
        .insert(statsMap)
        .values({ name: mapName })
        .onConflictDoNothing({ target: statsMap.name })
        .returning({ id: statsMap.id });
    if (inserted[0]) {
        return inserted[0].id;
    }

    const existing = await tx.select({ id: statsMap.id }).from(statsMap).where(eq(statsMap.name, mapName));

    return requireId(existing[0]?.id, 'Map');
}

async function getOrCreateSessionId(tx: IngestTransactionType, identity: SessionIdentityType): Promise<number> {
    const [insertedSession] = await tx
        .insert(statsSession)
        .values(identity)
        .onConflictDoNothing({ target: statsSession.sessionKey })
        .returning({ id: statsSession.id });
    if (insertedSession) {
        return insertedSession.id;
    }

    const [existingSession] = await tx
        .select({ id: statsSession.id, mapId: statsSession.mapId })
        .from(statsSession)
        .where(eq(statsSession.sessionKey, identity.sessionKey));
    if (!existingSession) {
        throw new Error(`Session ${identity.sessionKey} could not be resolved`);
    }

    if (existingSession.mapId !== identity.mapId) {
        throw new IngestConflictError(`Session ${identity.sessionKey} is already assigned to another map`);
    }

    return existingSession.id;
}

async function getOrCreateRound(
    tx: IngestTransactionType,
    sessionId: number,
    payload: IngestRoundType,
): Promise<RoundResolutionType> {
    const [insertedRound] = await tx
        .insert(statsRound)
        .values({
            sessionId,
            roundKey: payload.roundKey,
            startedAt: payload.startedAt,
            endedAt: payload.endedAt,
            winningTeam: payload.winningTeam,
            winningSubrole: payload.winningSubrole,
            telemetryVersion: payload.protocolVersion,
        })
        .onConflictDoNothing({ target: [statsRound.sessionId, statsRound.roundKey] })
        .returning({ id: statsRound.id });
    if (insertedRound) {
        return { id: insertedRound.id, created: true };
    }

    const [existingRound] = await tx
        .select({ id: statsRound.id })
        .from(statsRound)
        .where(and(eq(statsRound.sessionId, sessionId), eq(statsRound.roundKey, payload.roundKey)));

    return {
        id: requireId(existingRound?.id, `Round ${payload.roundKey}`),
        created: false,
    };
}

function isTeamkill(event: IngestDeathEventType): boolean {
    return Boolean(
        event.attacker &&
            event.attacker.steamId !== event.victim.steamId &&
            event.attacker.teamName !== TeamValues.nones &&
            event.attacker.teamName === event.victim.teamName,
    );
}

function createPlayerAggregates(payload: IngestRoundType): Map<string, PlayerAggregateType> {
    const aggregates = new Map<string, PlayerAggregateType>();
    for (const player of payload.players) {
        aggregates.set(player.steamId, { kills: 0, deaths: 0, teamKills: 0, weaponKills: new Map() });
    }

    for (const event of payload.events) {
        if (event.type !== 'death') {
            continue;
        }

        const victim = aggregates.get(event.victim.steamId);
        if (victim) {
            victim.deaths += 1;
        }

        if (!event.attacker || event.attacker.steamId === event.victim.steamId) {
            continue;
        }

        const attacker = aggregates.get(event.attacker.steamId);
        if (!attacker) {
            continue;
        }

        attacker.kills += 1;
        if (isTeamkill(event)) {
            attacker.teamKills += 1;
        }

        if (event.inflictor) {
            attacker.weaponKills.set(event.inflictor, (attacker.weaponKills.get(event.inflictor) ?? 0) + 1);
        }
    }

    return aggregates;
}

export async function createSession(payload: IngestSessionType): Promise<number> {
    return db.transaction(async (tx) => {
        const mapId = await getMapId(tx, payload.mapName);

        return getOrCreateSessionId(tx, {
            mapId,
            sessionKey: payload.sessionKey,
            startedAt: payload.startedAt,
        });
    });
}

export async function createRound(payload: IngestRoundType): Promise<number> {
    return db.transaction(async (tx) => {
        const mapId = await getMapId(tx, payload.mapName);
        const sessionId = await getOrCreateSessionId(tx, {
            mapId,
            sessionKey: payload.sessionKey,
            startedAt: payload.sessionStartedAt,
        });
        const round = await getOrCreateRound(tx, sessionId, payload);
        if (!round.created) {
            return round.id;
        }

        await tx
            .update(statsSession)
            .set({
                endedAt: sql`greatest(coalesce(${statsSession.endedAt}, ${payload.endedAt}::timestamptz), ${payload.endedAt}::timestamptz)`,
            })
            .where(eq(statsSession.id, sessionId));

        const playerIds = new Map<string, number>();
        for (const player of payload.players) {
            const [storedPlayer] = await tx
                .insert(statsPlayer)
                .values({ steamId: player.steamId })
                .onConflictDoNothing({ target: statsPlayer.steamId })
                .returning({ id: statsPlayer.id });
            const playerId =
                storedPlayer?.id ??
                (
                    await tx
                        .select({ id: statsPlayer.id })
                        .from(statsPlayer)
                        .where(eq(statsPlayer.steamId, player.steamId))
                )[0]?.id;
            playerIds.set(player.steamId, requireId(playerId, `Player ${player.steamId}`));
        }

        const aggregates = createPlayerAggregates(payload);
        const roundPlayerIds = new Map<string, number>();
        for (const player of payload.players) {
            const aggregate = aggregates.get(player.steamId);
            if (!aggregate) {
                throw new Error(`Aggregates for player ${player.steamId} could not be resolved`);
            }

            const [roundPlayer] = await tx
                .insert(statsRoundPlayer)
                .values({
                    roundId: round.id,
                    playerId: requireId(playerIds.get(player.steamId), `Player ${player.steamId}`),
                    initialTeamName: player.initialTeamName,
                    initialSubroleName: player.initialSubroleName,
                    finalTeamName: player.finalTeamName,
                    finalSubroleName: player.finalSubroleName,
                    joinedAt: player.joinedAt,
                    leftAt: player.leftAt,
                    kills: aggregate.kills,
                    deaths: aggregate.deaths,
                    teamKills: aggregate.teamKills,
                    damageDealt: player.damageDealt,
                    damageTaken: player.damageTaken,
                    shotsFired: player.shotsFired,
                    shotsHit: player.shotsHit,
                    survivalSeconds: player.survivalSeconds,
                })
                .returning({ id: statsRoundPlayer.id });

            roundPlayerIds.set(player.steamId, roundPlayer.id);
        }

        for (const event of [...payload.events].sort((left, right) => left.sequence - right.sequence)) {
            const [storedEvent] = await tx
                .insert(statsRoundEvent)
                .values({
                    roundId: round.id,
                    sequence: event.sequence,
                    type: event.type === 'roleChange' ? 'role_change' : event.type,
                    occurredAt: event.occurredAt,
                })
                .returning({ id: statsRoundEvent.id });

            switch (event.type) {
                case 'death': {
                    await tx.insert(statsDeath).values({
                        eventId: storedEvent.id,
                        victimPlayerId: requireId(
                            playerIds.get(event.victim.steamId),
                            `Victim ${event.victim.steamId}`,
                        ),
                        attackerPlayerId: event.attacker
                            ? requireId(playerIds.get(event.attacker.steamId), `Attacker ${event.attacker.steamId}`)
                            : null,
                        victimTeamName: event.victim.teamName,
                        victimSubroleName: event.victim.subroleName,
                        attackerTeamName: event.attacker?.teamName ?? null,
                        attackerSubroleName: event.attacker?.subroleName ?? null,
                        isTeamkill: isTeamkill(event),
                        inflictor: event.inflictor,
                        hitgroup: event.hitgroup,
                    });
                    break;
                }
                case 'roleChange': {
                    await tx.insert(statsRoleChange).values({
                        eventId: storedEvent.id,
                        playerId: requireId(playerIds.get(event.steamId), `Role-change player ${event.steamId}`),
                        fromTeamName: event.fromTeamName,
                        fromSubroleName: event.fromSubroleName,
                        toTeamName: event.toTeamName,
                        toSubroleName: event.toSubroleName,
                    });
                    break;
                }
                case 'revival': {
                    await tx.insert(statsRevival).values({
                        eventId: storedEvent.id,
                        playerId: requireId(playerIds.get(event.steamId), `Revived player ${event.steamId}`),
                        teamName: event.teamName,
                        subroleName: event.subroleName,
                    });
                    break;
                }
            }
        }

        for (const player of payload.players) {
            const aggregate = aggregates.get(player.steamId);
            if (!aggregate) {
                throw new Error(`Weapon aggregates for player ${player.steamId} could not be resolved`);
            }

            const weaponTelemetry = new Map(player.weapons.map((weapon) => [weapon.weaponName, weapon]));
            const weaponNames = new Set([...weaponTelemetry.keys(), ...aggregate.weaponKills.keys()]);
            for (const weaponName of weaponNames) {
                const telemetry = weaponTelemetry.get(weaponName);
                await tx.insert(statsWeaponStat).values({
                    roundPlayerId: requireId(roundPlayerIds.get(player.steamId), `Round player ${player.steamId}`),
                    weaponName,
                    kills: aggregate.weaponKills.get(weaponName) ?? 0,
                    shotsFired: telemetry?.shotsFired ?? null,
                    shotsHit: telemetry?.shotsHit ?? null,
                    damageDealt: telemetry?.damageDealt ?? null,
                });
            }
        }

        return round.id;
    });
}
