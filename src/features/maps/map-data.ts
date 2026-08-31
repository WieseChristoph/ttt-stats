import { asc, count, countDistinct, desc, eq, inArray, sql } from 'drizzle-orm';
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
import { enemyKillCount, headshotCount, teamKillCount } from '@/db/stats-expressions';
import { applySteamProfile, getSteamProfiles } from '@/features/steam/steam-profile-service';

export async function getMapCards() {
    const [maps, teamWins] = await Promise.all([
        db
            .select({
                id: statsMap.id,
                name: statsMap.name,
                sessions: countDistinct(statsSession.id),
                rounds: countDistinct(statsRound.id),
                players: countDistinct(statsRoundPlayer.playerId),
                deaths: countDistinct(statsDeath.eventId),
                playerRounds: countDistinct(statsRoundPlayer.id),
                teamKills:
                    sql<number>`count(distinct ${statsDeath.eventId}) filter (where ${statsDeath.isTeamkill})`.mapWith(
                        Number,
                    ),
                averageRoundDurationSeconds: sql<number>`coalesce((select avg(extract(epoch from (r.ended_at - r.started_at))) from stats_session s inner join stats_round r on r.session_id = s.id where s.map_id = ${statsMap.id}), 0)::double precision`,
                lastPlayed: sql<string>`max(${statsRound.endedAt})`,
                firstPlayed: sql<string>`min(${statsRound.startedAt})`,
            })
            .from(statsMap)
            .leftJoin(statsSession, eq(statsSession.mapId, statsMap.id))
            .leftJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
            .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
            .leftJoin(statsRoundEvent, eq(statsRoundEvent.roundId, statsRound.id))
            .leftJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id))
            .groupBy(statsMap.id)
            .orderBy(desc(sql`max(${statsRound.endedAt})`), asc(statsMap.name)),
        db
            .select({ mapId: statsMap.id, team: statsRound.winningTeam, wins: count(statsRound.id) })
            .from(statsMap)
            .innerJoin(statsSession, eq(statsSession.mapId, statsMap.id))
            .innerJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
            .groupBy(statsMap.id, statsRound.winningTeam)
            .orderBy(desc(count(statsRound.id))),
    ]);

    const winsByMap = new Map<number, (typeof teamWins)[number]>();
    for (const entry of teamWins) {
        if (!winsByMap.has(entry.mapId)) {
            winsByMap.set(entry.mapId, entry);
        }
    }

    return maps.map((map) => ({ ...map, leadingTeam: winsByMap.get(map.id) ?? null }));
}

export type MapCardType = Awaited<ReturnType<typeof getMapCards>>[number];

const MapHistoryPageSize = 10;

export async function getMapDetails(mapName: string, requestedPage: number) {
    const map = await db.query.statsMap.findFirst({
        where: eq(statsMap.name, mapName),
    });
    if (!map) {
        return undefined;
    }

    const [totalsRows, deathTotalsRows, participationRows, teamWins, weapons, leaders] = await Promise.all([
        db
            .select({
                sessions: countDistinct(statsSession.id),
                rounds: countDistinct(statsRound.id),
                averageRoundDurationSeconds: sql<number>`coalesce(avg(extract(epoch from (${statsRound.endedAt} - ${statsRound.startedAt}))), 0)::double precision`,
            })
            .from(statsSession)
            .leftJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
            .where(eq(statsSession.mapId, map.id)),
        db
            .select({
                deaths: count(statsDeath.eventId),
                enemyKills: enemyKillCount(),
                teamKills: teamKillCount(),
                headshots: headshotCount(),
                medianEliminationSeconds: sql<
                    number | null
                >`percentile_cont(0.5) within group (order by extract(epoch from (${statsRoundEvent.occurredAt} - ${statsRound.startedAt}))) filter (where ${statsRoundEvent.occurredAt} is not null)`,
            })
            .from(statsSession)
            .innerJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
            .innerJoin(statsRoundEvent, eq(statsRoundEvent.roundId, statsRound.id))
            .innerJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id))
            .where(eq(statsSession.mapId, map.id)),
        db
            .select({ playerRounds: count(statsRoundPlayer.id) })
            .from(statsSession)
            .innerJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
            .innerJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
            .where(eq(statsSession.mapId, map.id)),
        db
            .select({ team: statsRound.winningTeam, wins: count(statsRound.id) })
            .from(statsSession)
            .innerJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
            .where(eq(statsSession.mapId, map.id))
            .groupBy(statsRound.winningTeam)
            .orderBy(desc(count(statsRound.id))),
        db
            .select({
                weaponName: statsWeaponStat.weaponName,
                kills: sql<number>`sum(${statsWeaponStat.kills})`.mapWith(Number),
                users: countDistinct(statsRoundPlayer.playerId),
                shotsFired: sql<number>`sum(${statsWeaponStat.shotsFired})`.mapWith(Number),
                shotsHit: sql<number>`sum(${statsWeaponStat.shotsHit})`.mapWith(Number),
            })
            .from(statsWeaponStat)
            .innerJoin(statsRoundPlayer, eq(statsWeaponStat.roundPlayerId, statsRoundPlayer.id))
            .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .innerJoin(statsSession, eq(statsRound.sessionId, statsSession.id))
            .where(eq(statsSession.mapId, map.id))
            .groupBy(statsWeaponStat.weaponName)
            .orderBy(desc(sql`sum(${statsWeaponStat.kills})`))
            .limit(10),
        db
            .select({
                steamId: statsPlayer.steamId,
                rounds: count(statsRoundPlayer.id),
                kills: sql<number>`sum(${statsRoundPlayer.kills} - ${statsRoundPlayer.teamKills})`.mapWith(Number),
                deaths: sql<number>`sum(${statsRoundPlayer.deaths})`.mapWith(Number),
                wins: sql<number>`sum(case when ${statsRound.winningTeam} = ${statsRoundPlayer.finalTeamName} then 1 else 0 end)`.mapWith(
                    Number,
                ),
            })
            .from(statsPlayer)
            .innerJoin(statsRoundPlayer, eq(statsRoundPlayer.playerId, statsPlayer.id))
            .innerJoin(statsRound, eq(statsRoundPlayer.roundId, statsRound.id))
            .innerJoin(statsSession, eq(statsRound.sessionId, statsSession.id))
            .where(eq(statsSession.mapId, map.id))
            .groupBy(statsPlayer.id)
            .having(sql`count(${statsRoundPlayer.id}) >= 5`)
            .orderBy(desc(sql`sum(${statsRoundPlayer.kills} - ${statsRoundPlayer.teamKills})`))
            .limit(10),
    ]);
    const totals = totalsRows[0];
    const totalSessions = totals?.sessions ?? 0;
    const totalRounds = totals?.rounds ?? 0;
    const averageRoundDurationSeconds = totals?.averageRoundDurationSeconds ?? 0;
    const totalDeaths = deathTotalsRows[0]?.deaths ?? 0;
    const profiles = await getSteamProfiles(leaders.map((leader) => leader.steamId));
    const totalPages = Math.max(1, Math.ceil(totalSessions / MapHistoryPageSize));
    const page = Math.min(requestedPage, totalPages);

    const sessions = await db
        .select({
            id: statsSession.id,
            startedAt: statsSession.startedAt,
            lastRoundAt: sql<string | null>`max(${statsRound.endedAt})`,
            roundCount: countDistinct(statsRound.id),
        })
        .from(statsSession)
        .leftJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
        .where(eq(statsSession.mapId, map.id))
        .groupBy(statsSession.id)
        .orderBy(desc(statsSession.startedAt), desc(statsSession.id))
        .limit(MapHistoryPageSize)
        .offset((page - 1) * MapHistoryPageSize);

    const sessionIds = sessions.map((session) => session.id);
    const rounds = sessionIds.length
        ? await db
              .select({
                  id: statsRound.id,
                  sessionId: statsRound.sessionId,
                  startedAt: statsRound.startedAt,
                  endedAt: statsRound.endedAt,
                  winningTeam: statsRound.winningTeam,
                  playerCount: count(statsRoundPlayer.id),
              })
              .from(statsRound)
              .leftJoin(statsRoundPlayer, eq(statsRoundPlayer.roundId, statsRound.id))
              .where(inArray(statsRound.sessionId, sessionIds))
              .groupBy(statsRound.id)
              .orderBy(asc(statsRound.startedAt), asc(statsRound.id))
        : [];
    const roundsBySession = new Map<number, (typeof rounds)[number][]>();
    for (const round of rounds) {
        const sessionRounds = roundsBySession.get(round.sessionId) ?? [];
        sessionRounds.push(round);
        roundsBySession.set(round.sessionId, sessionRounds);
    }

    return {
        ...map,
        totalSessions,
        totalRounds,
        averageRoundDurationSeconds,
        totalDeaths,
        playerRounds: participationRows[0]?.playerRounds ?? 0,
        combat: deathTotalsRows[0],
        teamWins,
        weapons,
        leaders: leaders.map((leader) => applySteamProfile(leader, profiles)),
        pagination: { page, pageSize: MapHistoryPageSize, totalPages },
        sessions: sessions.map((session) => ({
            ...session,
            rounds: roundsBySession.get(session.id) ?? [],
        })),
    };
}

export type MapDetailsType = NonNullable<Awaited<ReturnType<typeof getMapDetails>>>;
