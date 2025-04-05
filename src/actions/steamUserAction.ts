"use server";

import { db } from "@/db/drizzle";
import { type NewSteamUser, insertSteamUserSchema, steamUser } from "@/db/schema/steamUser";
import { getSteamDataByIds } from "@/lib/steam";
import { buildConflictUpdateColumns } from "@/lib/utils";
import { z } from "zod";

export const getAllSteamIds = async () => {
	const results = await db.select({ steamId: steamUser.steamId }).from(steamUser);

	return results.map((result) => result.steamId);
};

export const loadSteamUsersByIds = async (steamIds: string[]) => {
	const uniqueSteamIds = [...new Set(steamIds)];
	const steamUsers = await getSteamDataByIds(uniqueSteamIds);

	if (steamUsers.length === 0) return;

	const mappedSteamUsers = steamUsers.map(
		(steamUser) =>
			({
				steamId: steamUser.steamid,
				username: steamUser.personaname,
				profileUrl: steamUser.profileurl,
				avatar: steamUser.avatar,
				avatarMedium: steamUser.avatarmedium,
				avatarFull: steamUser.avatarfull,
			}) as NewSteamUser,
	);

	const parsedSteamUsers = z.array(insertSteamUserSchema).parse(mappedSteamUsers);

	await db
		.insert(steamUser)
		.values(parsedSteamUsers)
		.onConflictDoUpdate({
			target: steamUser.steamId,
			set: buildConflictUpdateColumns(steamUser, ["username", "profileUrl", "avatar", "avatarMedium", "avatarFull"]),
		});
};
