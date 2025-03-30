"use server";

import { db } from "@/db/drizzle";
import {
	type NewSteamUser,
	insertSteamUserSchema,
	steamUser,
} from "@/db/schema/steamUser";
import { buildConflictUpdateColumns } from "@/lib/utils";
import { z } from "zod";

export const upsertSteamUsers = async (steamUsers: NewSteamUser[]) => {
	const parsedSteamUsers = z.array(insertSteamUserSchema).parse(steamUsers);

	await db
		.insert(steamUser)
		.values(parsedSteamUsers)
		.onConflictDoUpdate({
			target: steamUser.steamId,
			set: buildConflictUpdateColumns(steamUser, [
				"username",
				"profileUrl",
				"avatar",
				"avatarMedium",
				"avatarFull",
			]),
		});
};
