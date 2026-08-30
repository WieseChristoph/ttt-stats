import { asc, countDistinct, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { statsMap, statsPlayer, statsRound, statsRoundPlayer, statsSession } from '@/db/schema';
import { applySteamProfile, getSteamProfiles } from '@/features/steam/steam-profile-service';

export async function getPlayerCards() {
    const players = await db
        .select({
            steamId: statsPlayer.steamId,
            rounds: countDistinct(statsRoundPlayer.id),
            kills: sql<number>`coalesce(sum(${statsRoundPlayer.kills}), 0)`.mapWith(Number),
            deaths: sql<number>`coalesce(sum(${statsRoundPlayer.deaths}), 0)`.mapWith(Number),
            teamKills: sql<number>`coalesce(sum(${statsRoundPlayer.teamKills}), 0)`.mapWith(Number),
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

    const profiles = await getSteamProfiles(players.map((player) => player.steamId));

    return players.map((player) => applySteamProfile(player, profiles));
}

export type PlayerCardType = Awaited<ReturnType<typeof getPlayerCards>>[number];

export async function getPlayerDetails(steamId: string) {
    const [player, totals] = await Promise.all([
        db.query.statsPlayer.findFirst({
            where: eq(statsPlayer.steamId, steamId),
        }),
        db
            .select({
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
            .where(eq(statsPlayer.steamId, steamId)),
    ]);
    if (!player) {
        return undefined;
    }

    const [profiles, rounds] = await Promise.all([
        getSteamProfiles([player.steamId]),
        db
            .select({
                id: statsRoundPlayer.id,
                teamName: statsRoundPlayer.finalTeamName,
                subroleName: statsRoundPlayer.finalSubroleName,
                kills: statsRoundPlayer.kills,
                deaths: statsRoundPlayer.deaths,
                teamKills: statsRoundPlayer.teamKills,
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
            .limit(30),
    ]);

    return {
        ...applySteamProfile(player, profiles),
        totals: totals[0],
        rounds,
    };
}

export type PlayerDetailsType = NonNullable<Awaited<ReturnType<typeof getPlayerDetails>>>;
