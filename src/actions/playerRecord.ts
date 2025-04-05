"use server";

import { db } from "@/db/drizzle";
import { playerRecord } from "@/db/schema/playerRecord";

export const getAllUniqueSteamIds = async () => {
	const results = await db.selectDistinct({ steamId: playerRecord.steamId }).from(playerRecord);

	return results.map((result) => result.steamId);
};
