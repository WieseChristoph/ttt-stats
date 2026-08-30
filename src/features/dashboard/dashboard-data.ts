import { and, count, countDistinct, desc, eq, gte, lte, sql } from 'drizzle-orm';
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
import { applySteamProfile, getSteamProfiles } from '@/features/steam/steam-profile-service';

export type DateRangeType = {
    from: Date;
    to: Date;
};

export async function getDashboardData(range: DateRangeType) {
    const dateWhere = and(
        gte(statsRound.startedAt, range.from.toISOString()),
        lte(statsRound.startedAt, range.to.toISOString()),
    );

    const [totals, teamWins, weapons, recentRounds, topPlayers] = await Promise.all([
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
            .leftJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id))
            .where(dateWhere),
        db
            .select({ team: statsRound.winningTeam, wins: count(statsRound.id) })
            .from(statsRound)
            .where(dateWhere)
            .groupBy(statsRound.winningTeam)
            .orderBy(desc(count(statsRound.id))),
        db
            .select({
                weaponName: statsWeaponStat.weaponName,
                kills: sql<number>`sum(${statsWeaponStat.kills})`.mapWith(Number),
            })
            .from(statsWeaponStat)
            .innerJoin(statsRoundPlayer, eq(statsWeaponStat.roundPlayerId, statsRoundPlayer.id))
            .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .where(dateWhere)
            .groupBy(statsWeaponStat.weaponName)
            .orderBy(desc(sql`sum(${statsWeaponStat.kills})`))
            .limit(8),
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
            .where(dateWhere)
            .groupBy(statsRound.id, statsMap.name)
            .orderBy(desc(statsRound.endedAt))
            .limit(8),
        db
            .select({
                steamId: statsPlayer.steamId,
                kills: sql<number>`sum(${statsRoundPlayer.kills})`.mapWith(Number),
                deaths: sql<number>`sum(${statsRoundPlayer.deaths})`.mapWith(Number),
                rounds: count(statsRoundPlayer.id),
                wins: sql<number>`coalesce(sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end), 0)`.mapWith(
                    Number,
                ),
            })
            .from(statsPlayer)
            .innerJoin(statsRoundPlayer, eq(statsPlayer.id, statsRoundPlayer.playerId))
            .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .where(dateWhere)
            .groupBy(statsPlayer.id)
            .orderBy(desc(sql`sum(${statsRoundPlayer.kills})`))
            .limit(6),
    ]);

    const profiles = await getSteamProfiles(topPlayers.map((player) => player.steamId));

    return {
        totals: totals[0],
        teamWins,
        weapons,
        recentRounds,
        topPlayers: topPlayers.map((player) => applySteamProfile(player, profiles)),
    };
}

export type DashboardDataType = Awaited<ReturnType<typeof getDashboardData>>;
