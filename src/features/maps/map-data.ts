import { asc, count, countDistinct, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { statsDeath, statsMap, statsRound, statsRoundEvent, statsRoundPlayer, statsSession } from '@/db/schema';

export async function getMapCards() {
    return db
        .select({
            id: statsMap.id,
            name: statsMap.name,
            sessions: countDistinct(statsSession.id),
            rounds: countDistinct(statsRound.id),
            players: countDistinct(statsRoundPlayer.playerId),
            deaths: countDistinct(statsDeath.eventId),
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
        .orderBy(desc(sql`max(${statsRound.endedAt})`), asc(statsMap.name));
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

    const [totalsRows, deathTotalsRows] = await Promise.all([
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
            .select({ deaths: count(statsDeath.eventId) })
            .from(statsSession)
            .innerJoin(statsRound, eq(statsRound.sessionId, statsSession.id))
            .innerJoin(statsRoundEvent, eq(statsRoundEvent.roundId, statsRound.id))
            .innerJoin(statsDeath, eq(statsDeath.eventId, statsRoundEvent.id))
            .where(eq(statsSession.mapId, map.id)),
    ]);
    const totals = totalsRows[0];
    const totalSessions = totals?.sessions ?? 0;
    const totalRounds = totals?.rounds ?? 0;
    const averageRoundDurationSeconds = totals?.averageRoundDurationSeconds ?? 0;
    const totalDeaths = deathTotalsRows[0]?.deaths ?? 0;
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
        pagination: { page, pageSize: MapHistoryPageSize, totalPages },
        sessions: sessions.map((session) => ({
            ...session,
            rounds: roundsBySession.get(session.id) ?? [],
        })),
    };
}

export type MapDetailsType = NonNullable<Awaited<ReturnType<typeof getMapDetails>>>;
