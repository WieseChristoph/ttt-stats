"use server";

import { db } from "@/db/drizzle";
import { death, insertDeathSchema } from "@/db/schema/death";
import {
	insertPlayerRecordSchema,
	playerRecord,
} from "@/db/schema/playerRecord";
import { insertRoundSchema, round } from "@/db/schema/round";
import type { ApiRound } from "@/types/api/Round";
import { z } from "zod";

export const addRound = async (data: ApiRound) => {
	await db.transaction(async (tx) => {
		const parsedRound = insertRoundSchema.parse(data);

		const insertedRoundIds: { id: number }[] = await tx
			.insert(round)
			.values(parsedRound)
			.returning({ id: round.id });

		const roundId = insertedRoundIds[0].id;

		if (data.playerRecords && data.playerRecords.length > 0) {
			const parsedPlayerRecords = z.array(insertPlayerRecordSchema).parse(
				data.playerRecords.map((playerRecord) => ({
					...playerRecord,
					roundId,
				})),
			);

			const insertedPlayerRecordIds: { id: number }[] = await tx
				.insert(playerRecord)
				.values(parsedPlayerRecords)
				.returning({ id: playerRecord.id });

			for (const [index, playerRecord] of data.playerRecords.entries()) {
				if (playerRecord.deaths && playerRecord.deaths.length > 0) {
					const parsedDeaths = z.array(insertDeathSchema).parse(
						playerRecord.deaths.map((death) => ({
							...death,
							playerRecordId: insertedPlayerRecordIds[index].id,
						})),
					);

					await tx.insert(death).values(parsedDeaths);
				}
			}
		}
	});
};
