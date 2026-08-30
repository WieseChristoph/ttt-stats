import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { statsRound } from '@/db/schema';
import { applySteamProfile, getSteamProfiles, type SteamProfileType } from '@/features/steam/steam-profile-service';

const roundRelations = {
    session: { with: { map: true } },
    players: { with: { player: true, weapons: true } },
    events: {
        with: {
            death: { with: { victim: true, attacker: true } },
            roleChange: { with: { player: true } },
            revival: { with: { player: true } },
        },
    },
} as const;

const findLatestRound = () =>
    db.query.statsRound.findFirst({
        orderBy: [desc(statsRound.endedAt)],
        with: roundRelations,
    });

const findRoundById = (roundId: number) =>
    db.query.statsRound.findFirst({
        where: eq(statsRound.id, roundId),
        with: roundRelations,
    });

type QueriedRoundType = NonNullable<Awaited<ReturnType<typeof findLatestRound>>>;
type QueriedRoundEventType = QueriedRoundType['events'][number];

function compareRoundEvents(left: QueriedRoundEventType, right: QueriedRoundEventType): number {
    const leftTime = left.occurredAt ? Date.parse(left.occurredAt) : Number.NaN;
    const rightTime = right.occurredAt ? Date.parse(right.occurredAt) : Number.NaN;
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
        return leftTime - rightTime;
    }

    return left.sequence - right.sequence;
}

const enrichRound = (round: QueriedRoundType, profiles: Map<string, SteamProfileType>) => ({
    ...round,
    players: round.players.map((entry) => ({
        ...entry,
        player: applySteamProfile(entry.player, profiles),
    })),
    events: [...round.events].sort(compareRoundEvents).map((event) => ({
        ...event,
        death: event.death
            ? {
                  ...event.death,
                  victim: applySteamProfile(event.death.victim, profiles),
                  attacker: event.death.attacker ? applySteamProfile(event.death.attacker, profiles) : null,
              }
            : null,
        roleChange: event.roleChange
            ? {
                  ...event.roleChange,
                  player: applySteamProfile(event.roleChange.player, profiles),
              }
            : null,
        revival: event.revival
            ? {
                  ...event.revival,
                  player: applySteamProfile(event.revival.player, profiles),
              }
            : null,
    })),
});

const getRoundProfiles = async (round: QueriedRoundType) => {
    const steamIds = [
        ...round.players.map((entry) => entry.player.steamId),
        ...round.events.flatMap((event) => {
            if (event.death) {
                return [event.death.victim.steamId, ...(event.death.attacker ? [event.death.attacker.steamId] : [])];
            }
            if (event.roleChange) {
                return [event.roleChange.player.steamId];
            }
            return event.revival ? [event.revival.player.steamId] : [];
        }),
    ];

    return getSteamProfiles(steamIds);
};

export async function getLatestRoundDetails() {
    const round = await findLatestRound();
    if (!round) {
        return undefined;
    }

    return enrichRound(round, await getRoundProfiles(round));
}

export type RoundDetailsType = NonNullable<Awaited<ReturnType<typeof getLatestRoundDetails>>>;

export async function getRoundDetails(mapName: string, roundId: number) {
    const round = await findRoundById(roundId);
    if (!round || round.session.map.name !== mapName) {
        return undefined;
    }

    return enrichRound(round, await getRoundProfiles(round));
}

export type FullRoundType = NonNullable<Awaited<ReturnType<typeof getRoundDetails>>>;
