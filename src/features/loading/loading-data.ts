import { and, count, countDistinct, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import {
    statsDeath,
    statsMap,
    statsPlayer,
    statsRound,
    statsRoundEvent,
    statsRoundPlayer,
    statsSession,
    statsWeaponStat,
} from '@/db/schema';
import { getLatestRoundDetails } from '@/features/rounds/round-data';
import { applySteamProfile, getSteamProfiles, type SteamProfileType } from '@/features/steam/steam-profile-service';

export async function getLoadingSnapshot(mapName?: string, steamId?: string) {
    const latestRound = await getLatestRoundDetails();
    if (!latestRound) {
        return null;
    }

    const [recentRounds, globalStats, teamWins, mapStats, requestedMapStats, requestedPlayer] = await Promise.all([
        db
            .select({
                id: statsRound.id,
                startedAt: statsRound.startedAt,
                endedAt: statsRound.endedAt,
                winningTeam: statsRound.winningTeam,
                mapName: statsMap.name,
                playerCount: count(statsRoundPlayer.id),
            })
            .from(statsRound)
            .innerJoin(statsSession, eq(statsRound.sessionId, statsSession.id))
            .innerJoin(statsMap, eq(statsSession.mapId, statsMap.id))
            .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
            .groupBy(statsRound.id, statsMap.name)
            .orderBy(desc(statsRound.endedAt))
            .limit(6),
        db
            .select({
                rounds: countDistinct(statsRound.id),
                sessions: countDistinct(statsSession.id),
                maps: countDistinct(statsMap.id),
                players: countDistinct(statsPlayer.id),
                playerRounds: countDistinct(statsRoundPlayer.id),
                deaths: countDistinct(statsDeath.eventId),
            })
            .from(statsRound)
            .leftJoin(statsSession, eq(statsRound.sessionId, statsSession.id))
            .leftJoin(statsMap, eq(statsSession.mapId, statsMap.id))
            .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
            .leftJoin(statsPlayer, eq(statsPlayer.id, statsRoundPlayer.playerId))
            .leftJoin(statsRoundEvent, eq(statsRoundEvent.roundId, statsRound.id))
            .leftJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id)),
        db
            .select({ team: statsRound.winningTeam, wins: count(statsRound.id) })
            .from(statsRound)
            .groupBy(statsRound.winningTeam)
            .orderBy(desc(count(statsRound.id))),
        db
            .select({
                rounds: countDistinct(statsRound.id),
                sessions: countDistinct(statsSession.id),
                players: countDistinct(statsPlayer.id),
                deaths: countDistinct(statsDeath.eventId),
            })
            .from(statsRound)
            .innerJoin(statsSession, eq(statsRound.sessionId, statsSession.id))
            .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
            .leftJoin(statsPlayer, eq(statsPlayer.id, statsRoundPlayer.playerId))
            .leftJoin(statsRoundEvent, eq(statsRoundEvent.roundId, statsRound.id))
            .leftJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id))
            .where(eq(statsSession.mapId, latestRound.session.mapId)),
        mapName
            ? db
                  .select({
                      rounds: countDistinct(statsRound.id),
                      sessions: countDistinct(statsSession.id),
                      players: countDistinct(statsPlayer.id),
                      deaths: countDistinct(statsDeath.eventId),
                  })
                  .from(statsMap)
                  .leftJoin(statsSession, eq(statsSession.mapId, statsMap.id))
                  .leftJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
                  .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
                  .leftJoin(statsPlayer, eq(statsPlayer.id, statsRoundPlayer.playerId))
                  .leftJoin(statsRoundEvent, eq(statsRoundEvent.roundId, statsRound.id))
                  .leftJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id))
                  .where(eq(statsMap.name, mapName))
            : Promise.resolve([]),
        steamId
            ? db
                  .select({
                      steamId: statsPlayer.steamId,
                      playerId: statsPlayer.id,
                      rounds: countDistinct(statsRoundPlayer.id),
                      kills: sql<number>`coalesce(sum(${statsRoundPlayer.kills}), 0)`.mapWith(Number),
                      deaths: sql<number>`coalesce(sum(${statsRoundPlayer.deaths}), 0)`.mapWith(Number),
                      teamKills: sql<number>`coalesce(sum(${statsRoundPlayer.teamKills}), 0)`.mapWith(Number),
                      wins: sql<number>`coalesce(sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end), 0)`.mapWith(
                          Number,
                      ),
                  })
                  .from(statsPlayer)
                  .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.playerId, statsPlayer.id))
                  .leftJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
                  .where(eq(statsPlayer.steamId, steamId))
                  .groupBy(statsPlayer.id)
            : Promise.resolve([]),
    ]);

    const requestedPlayerRecord = requestedPlayer[0];
    const [requestedPlayerProfiles, requestedPlayerHeadshots, requestedPlayerWeapons] = requestedPlayerRecord
        ? await Promise.all([
              getSteamProfiles([requestedPlayerRecord.steamId]),
              db
                  .select({ headshots: count(statsDeath.eventId) })
                  .from(statsDeath)
                  .where(
                      and(eq(statsDeath.attackerPlayerId, requestedPlayerRecord.playerId), eq(statsDeath.hitgroup, 1)),
                  ),
              db
                  .select({
                      weaponName: statsWeaponStat.weaponName,
                      kills: sql<number>`sum(${statsWeaponStat.kills})`.mapWith(Number),
                  })
                  .from(statsWeaponStat)
                  .innerJoin(statsRoundPlayer, eq(statsWeaponStat.roundPlayerId, statsRoundPlayer.id))
                  .where(eq(statsRoundPlayer.playerId, requestedPlayerRecord.playerId))
                  .groupBy(statsWeaponStat.weaponName)
                  .orderBy(desc(sql`sum(${statsWeaponStat.kills})`))
                  .limit(1),
          ])
        : [new Map<string, SteamProfileType>(), [], []];

    return {
        latestRound,
        recentRounds,
        globalStats: globalStats[0],
        teamWins,
        mapStats: mapStats[0],
        requestedMap: mapName ? { name: mapName, stats: requestedMapStats[0] ?? null } : null,
        requestedPlayer: requestedPlayerRecord
            ? {
                  ...requestedPlayerRecord,
                  ...applySteamProfile(requestedPlayerRecord, requestedPlayerProfiles),
                  headshots: requestedPlayerHeadshots[0]?.headshots ?? 0,
                  favoriteWeapon: requestedPlayerWeapons[0]?.weaponName ?? null,
              }
            : null,
    };
}

export type LoadingSnapshotType = NonNullable<Awaited<ReturnType<typeof getLoadingSnapshot>>>;
