import { z } from 'zod';
import env from '@/config/env';

const SteamPlayerSummarySchema = z.object({
    steamid: z.string(),
    personaname: z.string(),
    profileurl: z.url().nullable().optional(),
    avatar: z.url().nullable().optional(),
    avatarmedium: z.url().nullable().optional(),
    avatarfull: z.url().nullable().optional(),
});

const SteamPlayerResponseSchema = z.object({
    response: z.object({
        players: z.array(SteamPlayerSummarySchema),
    }),
});

export const SteamProfileSchema = z.object({
    username: z.string(),
    profileUrl: z.url().nullable(),
    avatar: z.url().nullable(),
    avatarMedium: z.url().nullable(),
    avatarFull: z.url().nullable(),
});

export type SteamProfileType = z.infer<typeof SteamProfileSchema>;

export type SteamLookupType = {
    profiles: Map<string, SteamProfileType>;
    resolvedSteamIds: Set<string>;
};

export async function fetchSteamProfiles(steamIds: string[]): Promise<SteamLookupType> {
    const apiKey = env.STEAM_API_KEY;
    const profiles = new Map<string, SteamProfileType>();
    const resolvedSteamIds = new Set<string>();
    if (!apiKey || steamIds.length === 0) {
        return { profiles, resolvedSteamIds };
    }

    for (let index = 0; index < steamIds.length; index += 100) {
        const batch = steamIds.slice(index, index + 100);
        const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
        url.searchParams.set('key', apiKey);
        url.searchParams.set('steamids', batch.join(','));

        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!response.ok) {
                console.error(`Steam profile lookup failed with HTTP ${response.status}`);
                continue;
            }

            const body: unknown = await response.json();
            const parsed = SteamPlayerResponseSchema.safeParse(body);
            if (!parsed.success) {
                console.error('Steam profile lookup returned an unexpected response');
                continue;
            }

            for (const steamId of batch) {
                resolvedSteamIds.add(steamId);
            }

            for (const player of parsed.data.response.players) {
                profiles.set(player.steamid, {
                    username: player.personaname,
                    profileUrl: player.profileurl ?? null,
                    avatar: player.avatar ?? null,
                    avatarMedium: player.avatarmedium ?? null,
                    avatarFull: player.avatarfull ?? null,
                });
            }
        } catch (error) {
            console.error('Steam profile lookup failed', error);
        }
    }

    return { profiles, resolvedSteamIds };
}
