"use server";

import type { SteamResponse, SteamUser } from "@/types/Steam";

export async function getSteamDataByIds(
	steamIds: string[],
): Promise<SteamUser[]> {
	if (steamIds.length <= 0) return [];

	if (!process.env.STEAM_API_KEY) {
		console.error("Steam API-Key is missing!");

		return [];
	}

	const result = await fetch(
		`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamIds.join(",")}`,
	);

	if (!result.ok) {
		console.error(
			`Failed to fetch steam data: ${result.status} ${result.statusText}`,
		);
		return [];
	}

	const data = (await result.json()) as SteamResponse;

	return data.response.players;
}
