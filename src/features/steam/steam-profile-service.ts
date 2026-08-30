import { z } from 'zod';
import env from '@/config/env';
import { getRedisClient, markRedisUnavailable } from '@/shared/redis';
import { fetchSteamProfiles, SteamProfileSchema, type SteamProfileType } from './steam-api-client';

export type { SteamProfileType } from './steam-api-client';

const SteamProfileCacheSchema = z.object({
    profile: SteamProfileSchema.nullable(),
});

const cacheKey = (steamId: string) => `steam:profile:v1:${steamId}`;

export async function getSteamProfiles(steamIds: readonly string[]): Promise<Map<string, SteamProfileType>> {
    const uniqueSteamIds = [...new Set(steamIds)].filter(Boolean);
    const profiles = new Map<string, SteamProfileType>();
    if (uniqueSteamIds.length === 0) {
        return profiles;
    }

    const redis = await getRedisClient();
    const uncachedSteamIds = [...uniqueSteamIds];
    if (redis) {
        try {
            const cachedValues = await Promise.all(uniqueSteamIds.map((steamId) => redis.get(cacheKey(steamId))));
            for (const [index, cachedValue] of cachedValues.entries()) {
                if (!cachedValue) {
                    continue;
                }

                let parsedValue: ReturnType<typeof SteamProfileCacheSchema.safeParse>;
                try {
                    parsedValue = SteamProfileCacheSchema.safeParse(JSON.parse(cachedValue));
                } catch {
                    continue;
                }

                if (parsedValue.success) {
                    const steamId = uniqueSteamIds[index];
                    if (parsedValue.data.profile) {
                        profiles.set(steamId, parsedValue.data.profile);
                    }

                    uncachedSteamIds.splice(uncachedSteamIds.indexOf(steamId), 1);
                }
            }
        } catch (error) {
            markRedisUnavailable(error);
        }
    }

    if (env.STEAM_API_KEY) {
        const fetched = await fetchSteamProfiles(uncachedSteamIds);
        for (const steamId of fetched.resolvedSteamIds) {
            const profile = fetched.profiles.get(steamId);
            if (profile) {
                profiles.set(steamId, profile);
            }

            if (redis) {
                try {
                    await redis.set(
                        cacheKey(steamId),
                        JSON.stringify({ profile: profile ?? null }),
                        'EX',
                        env.STEAM_PROFILE_CACHE_TTL_SECONDS,
                    );
                } catch (error) {
                    markRedisUnavailable(error);
                }
            }
        }
    }
    return profiles;
}

export function applySteamProfile<PlayerType extends { steamId: string }>(
    player: PlayerType,
    profiles: Map<string, SteamProfileType>,
): PlayerType & Partial<SteamProfileType> {
    const profile = profiles.get(player.steamId);
    return profile ? { ...player, ...profile } : player;
}
