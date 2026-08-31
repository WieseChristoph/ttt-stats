import { and, count, countDistinct, desc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { resolveQueries } from '@/db/resolve-queries';
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
import { enemyKillCount, headshotCount, teamKillCount } from '@/db/stats-expressions';
import { applySteamProfile, getSteamProfiles } from '@/features/steam/steam-profile-service';

export type DateRangeType = { from: Date; to: Date };

function getDateWhere(range: DateRangeType) {
    return and(gte(statsRound.startedAt, range.from.toISOString()), lte(statsRound.startedAt, range.to.toISOString()));
}

type DateWhereType = ReturnType<typeof getDateWhere>;

function getTotals(dateWhere: DateWhereType) {
    return db
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
        .where(dateWhere);
}

function getPace(dateWhere: DateWhereType) {
    return db
        .select({
            averageRoundDurationSeconds: sql<number>`coalesce(avg(extract(epoch from (${statsRound.endedAt} - ${statsRound.startedAt}))), 0)::double precision`,
        })
        .from(statsRound)
        .where(dateWhere);
}

function getCombat(dateWhere: DateWhereType) {
    return db
        .select({
            enemyKills: enemyKillCount(),
            teamKills: teamKillCount(),
            headshots: headshotCount(),
            worldDeaths: sql<number>`count(*) filter (where ${statsDeath.attackerPlayerId} is null)`.mapWith(Number),
        })
        .from(statsDeath)
        .innerJoin(statsRoundEvent, eq(statsDeath.eventId, statsRoundEvent.id))
        .innerJoin(statsRound, eq(statsRoundEvent.roundId, statsRound.id))
        .where(dateWhere);
}

function getTelemetry(dateWhere: DateWhereType) {
    return db
        .select({
            telemetryRounds: countDistinct(statsRoundPlayer.roundId),
            shotsFired: sql<number>`coalesce(sum(${statsRoundPlayer.shotsFired}), 0)`.mapWith(Number),
            shotsHit: sql<number>`coalesce(sum(${statsRoundPlayer.shotsHit}), 0)`.mapWith(Number),
            damageDealt: sql<number>`coalesce(sum(${statsRoundPlayer.damageDealt}), 0)`.mapWith(Number),
        })
        .from(statsRoundPlayer)
        .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
        .where(and(dateWhere, isNotNull(statsRoundPlayer.shotsFired)));
}

function getTeamWins(dateWhere: DateWhereType) {
    return db
        .select({ team: statsRound.winningTeam, wins: count(statsRound.id) })
        .from(statsRound)
        .where(dateWhere)
        .groupBy(statsRound.winningTeam)
        .orderBy(desc(count(statsRound.id)));
}

function getWeapons(dateWhere: DateWhereType) {
    return db
        .select({
            weaponName: statsWeaponStat.weaponName,
            kills: sql<number>`sum(${statsWeaponStat.kills})`.mapWith(Number),
            users: countDistinct(statsRoundPlayer.playerId),
            uses: count(statsWeaponStat.id),
            shotsFired: sql<number>`sum(${statsWeaponStat.shotsFired})`.mapWith(Number),
            shotsHit: sql<number>`sum(${statsWeaponStat.shotsHit})`.mapWith(Number),
            damageDealt: sql<number>`sum(${statsWeaponStat.damageDealt})`.mapWith(Number),
        })
        .from(statsWeaponStat)
        .innerJoin(statsRoundPlayer, eq(statsWeaponStat.roundPlayerId, statsRoundPlayer.id))
        .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
        .where(dateWhere)
        .groupBy(statsWeaponStat.weaponName)
        .orderBy(desc(sql`sum(${statsWeaponStat.kills})`))
        .limit(10);
}

function getRecentRounds(dateWhere: DateWhereType) {
    return db
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
        .limit(8);
}

function getTopPlayers(dateWhere: DateWhereType) {
    return db
        .select({
            steamId: statsPlayer.steamId,
            kills: sql<number>`sum(${statsRoundPlayer.kills})`.mapWith(Number),
            teamKills: sql<number>`sum(${statsRoundPlayer.teamKills})`.mapWith(Number),
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
        .orderBy(desc(sql`sum(${statsRoundPlayer.kills} - ${statsRoundPlayer.teamKills})`))
        .limit(6);
}

function getRoles(dateWhere: DateWhereType) {
    return db
        .select({
            roleName: sql<string>`lower(trim(${statsRoundPlayer.finalSubroleName}))`,
            appearances: count(statsRoundPlayer.id),
            wins: sql<number>`sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end)`.mapWith(
                Number,
            ),
            kills: sql<number>`sum(${statsRoundPlayer.kills} - ${statsRoundPlayer.teamKills})`.mapWith(Number),
            deaths: sql<number>`sum(${statsRoundPlayer.deaths})`.mapWith(Number),
            telemetryRounds: sql<number>`count(*) filter (where ${statsRoundPlayer.shotsFired} is not null)`.mapWith(
                Number,
            ),
            shotsFired: sql<number>`sum(${statsRoundPlayer.shotsFired})`.mapWith(Number),
            shotsHit: sql<number>`sum(${statsRoundPlayer.shotsHit})`.mapWith(Number),
            damageDealt: sql<number>`sum(${statsRoundPlayer.damageDealt})`.mapWith(Number),
            survivalSeconds: sql<number>`sum(${statsRoundPlayer.survivalSeconds})`.mapWith(Number),
        })
        .from(statsRoundPlayer)
        .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
        .where(and(dateWhere, isNotNull(statsRoundPlayer.finalSubroleName)))
        .groupBy(sql`lower(trim(${statsRoundPlayer.finalSubroleName}))`)
        .orderBy(desc(count(statsRoundPlayer.id)));
}

function getTrends(dateWhere: DateWhereType) {
    return db
        .select({
            week: sql<string>`to_char(date_trunc('week', ${statsRound.startedAt}), 'YYYY-MM-DD')`,
            rounds: countDistinct(statsRound.id),
            playerRounds: countDistinct(statsRoundPlayer.id),
            deaths: countDistinct(statsDeath.eventId),
        })
        .from(statsRound)
        .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
        .leftJoin(statsRoundEvent, eq(statsRoundEvent.roundId, statsRound.id))
        .leftJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id))
        .where(dateWhere)
        .groupBy(sql`date_trunc('week', ${statsRound.startedAt})`)
        .orderBy(sql`date_trunc('week', ${statsRound.startedAt})`);
}

export async function getDashboardData(range: DateRangeType) {
    const dateWhere = getDateWhere(range);
    const { totals, pace, combat, telemetry, teamWins, weapons, recentRounds, topPlayers, roles, trends } =
        await resolveQueries({
            totals: getTotals(dateWhere),
            pace: getPace(dateWhere),
            combat: getCombat(dateWhere),
            telemetry: getTelemetry(dateWhere),
            teamWins: getTeamWins(dateWhere),
            weapons: getWeapons(dateWhere),
            recentRounds: getRecentRounds(dateWhere),
            topPlayers: getTopPlayers(dateWhere),
            roles: getRoles(dateWhere),
            trends: getTrends(dateWhere),
        });
    const profiles = await getSteamProfiles(topPlayers.map((player) => player.steamId));

    return {
        totals: totals[0],
        pace: pace[0],
        combat: combat[0],
        telemetry: telemetry[0],
        teamWins,
        weapons,
        roles,
        trends,
        recentRounds,
        topPlayers: topPlayers.map((player) => applySteamProfile(player, profiles)),
    };
}

export type DashboardDataType = Awaited<ReturnType<typeof getDashboardData>>;
