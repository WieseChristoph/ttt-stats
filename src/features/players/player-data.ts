import { and, asc, count, countDistinct, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { resolveQueries } from '@/db/resolve-queries';
import {
    statsDeath,
    statsMap,
    statsPlayer,
    statsRound,
    statsRoundPlayer,
    statsSession,
    statsWeaponStat,
} from '@/db/schema';
import { eligibleHeadshotKillCondition, eligibleHeadshotKillCount, headshotCount } from '@/db/stats-expressions';
import { applySteamProfile, getSteamProfiles } from '@/features/steam/steam-profile-service';

export async function getPlayerCards() {
    const players = await db
        .select({
            id: statsPlayer.id,
            steamId: statsPlayer.steamId,
            rounds: countDistinct(statsRoundPlayer.id),
            kills: sql<number>`coalesce(sum(${statsRoundPlayer.kills}), 0)`.mapWith(Number),
            deaths: sql<number>`coalesce(sum(${statsRoundPlayer.deaths}), 0)`.mapWith(Number),
            teamKills: sql<number>`coalesce(sum(${statsRoundPlayer.teamKills}), 0)`.mapWith(Number),
            telemetryRounds: sql<number>`count(*) filter (where ${statsRoundPlayer.shotsFired} is not null)`.mapWith(
                Number,
            ),
            shotsFired: sql<number>`sum(${statsRoundPlayer.shotsFired})`.mapWith(Number),
            shotsHit: sql<number>`sum(${statsRoundPlayer.shotsHit})`.mapWith(Number),
            damageDealt: sql<number>`sum(${statsRoundPlayer.damageDealt})`.mapWith(Number),
            survivalSeconds: sql<number>`sum(${statsRoundPlayer.survivalSeconds})`.mapWith(Number),
            wins: sql<number>`coalesce(sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end), 0)`.mapWith(
                Number,
            ),
            lastPlayed: sql<string | null>`max(${statsRound.endedAt})`,
        })
        .from(statsPlayer)
        .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.playerId, statsPlayer.id))
        .leftJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
        .groupBy(statsPlayer.id)
        .orderBy(desc(sql`sum(${statsRoundPlayer.kills})`), asc(statsPlayer.steamId));

    const { profiles, headshots } = await resolveQueries({
        profiles: getSteamProfiles(players.map((player) => player.steamId)),
        headshots: db
            .select({
                playerId: statsDeath.attackerPlayerId,
                headshots: headshotCount(),
                headshotEligibleKills: eligibleHeadshotKillCount(),
            })
            .from(statsDeath)
            .where(eligibleHeadshotKillCondition())
            .groupBy(statsDeath.attackerPlayerId),
    });
    const headshotsByPlayer = new Map(headshots.map((entry) => [entry.playerId, entry]));

    return players.map((player) => {
        const headshotStats = headshotsByPlayer.get(player.id);
        return {
            ...applySteamProfile(player, profiles),
            headshots: headshotStats?.headshots ?? 0,
            headshotEligibleKills: headshotStats?.headshotEligibleKills ?? 0,
        };
    });
}

export type PlayerCardType = Awaited<ReturnType<typeof getPlayerCards>>[number];

export async function getPlayerDetails(steamId: string) {
    const { player, totals } = await resolveQueries({
        player: db.query.statsPlayer.findFirst({
            where: eq(statsPlayer.steamId, steamId),
        }),
        totals: db
            .select({
                rounds: countDistinct(statsRoundPlayer.id),
                kills: sql<number>`coalesce(sum(${statsRoundPlayer.kills}), 0)`.mapWith(Number),
                deaths: sql<number>`coalesce(sum(${statsRoundPlayer.deaths}), 0)`.mapWith(Number),
                teamKills: sql<number>`coalesce(sum(${statsRoundPlayer.teamKills}), 0)`.mapWith(Number),
                telemetryRounds:
                    sql<number>`count(*) filter (where ${statsRoundPlayer.shotsFired} is not null)`.mapWith(Number),
                shotsFired: sql<number>`sum(${statsRoundPlayer.shotsFired})`.mapWith(Number),
                shotsHit: sql<number>`sum(${statsRoundPlayer.shotsHit})`.mapWith(Number),
                damageDealt: sql<number>`sum(${statsRoundPlayer.damageDealt})`.mapWith(Number),
                damageTaken: sql<number>`sum(${statsRoundPlayer.damageTaken})`.mapWith(Number),
                survivalSeconds: sql<number>`sum(${statsRoundPlayer.survivalSeconds})`.mapWith(Number),
                wins: sql<number>`coalesce(sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end), 0)`.mapWith(
                    Number,
                ),
            })
            .from(statsPlayer)
            .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.playerId, statsPlayer.id))
            .leftJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .where(eq(statsPlayer.steamId, steamId)),
    });
    if (!player) {
        return undefined;
    }

    const { profiles, rounds, headshots, roles, weapons, maps, killsAgainst, deathsTo } = await resolveQueries({
        profiles: getSteamProfiles([player.steamId]),
        rounds: db
            .select({
                id: statsRoundPlayer.id,
                teamName: statsRoundPlayer.finalTeamName,
                subroleName: statsRoundPlayer.finalSubroleName,
                kills: statsRoundPlayer.kills,
                deaths: statsRoundPlayer.deaths,
                teamKills: statsRoundPlayer.teamKills,
                damageDealt: statsRoundPlayer.damageDealt,
                damageTaken: statsRoundPlayer.damageTaken,
                shotsFired: statsRoundPlayer.shotsFired,
                shotsHit: statsRoundPlayer.shotsHit,
                survivalSeconds: statsRoundPlayer.survivalSeconds,
                roundId: statsRound.id,
                roundStartedAt: statsRound.startedAt,
                winningTeam: statsRound.winningTeam,
                mapName: statsMap.name,
            })
            .from(statsRoundPlayer)
            .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .innerJoin(statsSession, eq(statsRound.sessionId, statsSession.id))
            .innerJoin(statsMap, eq(statsSession.mapId, statsMap.id))
            .where(eq(statsRoundPlayer.playerId, player.id))
            .orderBy(desc(statsRound.startedAt), desc(statsRound.id))
            .limit(50),
        headshots: db
            .select({
                headshots: headshotCount(),
                headshotEligibleKills: eligibleHeadshotKillCount(),
            })
            .from(statsDeath)
            .where(and(eq(statsDeath.attackerPlayerId, player.id), eligibleHeadshotKillCondition())),
        roles: db
            .select({
                roleName: statsRoundPlayer.finalSubroleName,
                teamName: statsRoundPlayer.finalTeamName,
                rounds: count(statsRoundPlayer.id),
                wins: sql<number>`sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end)`.mapWith(
                    Number,
                ),
                kills: sql<number>`sum(${statsRoundPlayer.kills} - ${statsRoundPlayer.teamKills})`.mapWith(Number),
                deaths: sql<number>`sum(${statsRoundPlayer.deaths})`.mapWith(Number),
                telemetryRounds:
                    sql<number>`count(*) filter (where ${statsRoundPlayer.shotsFired} is not null)`.mapWith(Number),
                shotsFired: sql<number>`sum(${statsRoundPlayer.shotsFired})`.mapWith(Number),
                shotsHit: sql<number>`sum(${statsRoundPlayer.shotsHit})`.mapWith(Number),
                damageDealt: sql<number>`sum(${statsRoundPlayer.damageDealt})`.mapWith(Number),
                survivalSeconds: sql<number>`sum(${statsRoundPlayer.survivalSeconds})`.mapWith(Number),
            })
            .from(statsRoundPlayer)
            .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .where(and(eq(statsRoundPlayer.playerId, player.id), isNotNull(statsRoundPlayer.finalSubroleName)))
            .groupBy(statsRoundPlayer.finalSubroleName, statsRoundPlayer.finalTeamName)
            .orderBy(desc(count(statsRoundPlayer.id))),
        weapons: db
            .select({
                weaponName: statsWeaponStat.weaponName,
                uses: count(statsWeaponStat.id),
                kills: sql<number>`sum(${statsWeaponStat.kills})`.mapWith(Number),
                shotsFired: sql<number>`sum(${statsWeaponStat.shotsFired})`.mapWith(Number),
                shotsHit: sql<number>`sum(${statsWeaponStat.shotsHit})`.mapWith(Number),
                damageDealt: sql<number>`sum(${statsWeaponStat.damageDealt})`.mapWith(Number),
            })
            .from(statsWeaponStat)
            .innerJoin(statsRoundPlayer, eq(statsWeaponStat.roundPlayerId, statsRoundPlayer.id))
            .where(eq(statsRoundPlayer.playerId, player.id))
            .groupBy(statsWeaponStat.weaponName)
            .orderBy(desc(sql`sum(${statsWeaponStat.kills})`)),
        maps: db
            .select({
                mapName: statsMap.name,
                rounds: count(statsRoundPlayer.id),
                wins: sql<number>`sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end)`.mapWith(
                    Number,
                ),
                kills: sql<number>`sum(${statsRoundPlayer.kills} - ${statsRoundPlayer.teamKills})`.mapWith(Number),
                deaths: sql<number>`sum(${statsRoundPlayer.deaths})`.mapWith(Number),
                telemetryRounds:
                    sql<number>`count(*) filter (where ${statsRoundPlayer.shotsFired} is not null)`.mapWith(Number),
                damageDealt: sql<number>`sum(${statsRoundPlayer.damageDealt})`.mapWith(Number),
            })
            .from(statsRoundPlayer)
            .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .innerJoin(statsSession, eq(statsRound.sessionId, statsSession.id))
            .innerJoin(statsMap, eq(statsSession.mapId, statsMap.id))
            .where(eq(statsRoundPlayer.playerId, player.id))
            .groupBy(statsMap.id)
            .orderBy(desc(count(statsRoundPlayer.id))),
        killsAgainst: db
            .select({ steamId: statsPlayer.steamId, kills: count(statsDeath.eventId) })
            .from(statsDeath)
            .innerJoin(statsPlayer, eq(statsDeath.victimPlayerId, statsPlayer.id))
            .where(
                and(
                    eq(statsDeath.attackerPlayerId, player.id),
                    eq(statsDeath.isTeamkill, false),
                    sql`${statsDeath.attackerPlayerId} <> ${statsDeath.victimPlayerId}`,
                ),
            )
            .groupBy(statsPlayer.id),
        deathsTo: db
            .select({ steamId: statsPlayer.steamId, deaths: count(statsDeath.eventId) })
            .from(statsDeath)
            .innerJoin(statsPlayer, eq(statsDeath.attackerPlayerId, statsPlayer.id))
            .where(
                and(
                    eq(statsDeath.victimPlayerId, player.id),
                    eq(statsDeath.isTeamkill, false),
                    sql`${statsDeath.attackerPlayerId} <> ${statsDeath.victimPlayerId}`,
                ),
            )
            .groupBy(statsPlayer.id),
    });

    const headToHeadSteamIds = [...new Set([...killsAgainst, ...deathsTo].map((entry) => entry.steamId))];
    const headToHeadProfiles = await getSteamProfiles(headToHeadSteamIds);
    const killsBySteamId = new Map(killsAgainst.map((entry) => [entry.steamId, entry.kills]));
    const deathsBySteamId = new Map(deathsTo.map((entry) => [entry.steamId, entry.deaths]));
    const headToHead = headToHeadSteamIds
        .map((opponentSteamId) => ({
            ...applySteamProfile({ steamId: opponentSteamId }, headToHeadProfiles),
            kills: killsBySteamId.get(opponentSteamId) ?? 0,
            deaths: deathsBySteamId.get(opponentSteamId) ?? 0,
        }))
        .sort((left, right) => right.kills + right.deaths - (left.kills + left.deaths));

    return {
        ...applySteamProfile(player, profiles),
        totals: totals[0],
        headshots: headshots[0]?.headshots ?? 0,
        headshotEligibleKills: headshots[0]?.headshotEligibleKills ?? 0,
        rounds,
        roles,
        weapons,
        maps,
        headToHead,
    };
}

export type PlayerDetailsType = NonNullable<Awaited<ReturnType<typeof getPlayerDetails>>>;
