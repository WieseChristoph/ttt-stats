"use server";

import { db } from "@/db/drizzle";
import { death, insertDeathSchema } from "@/db/schema/death";
import { insertPlayerRecordSchema, playerRecord } from "@/db/schema/playerRecord";
import { insertRoundSchema, round } from "@/db/schema/round";
import type { ApiRound } from "@/types/api/Round";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

export const addRound = async (data: ApiRound) => {
	await db.transaction(async (tx) => {
		const parsedRound = insertRoundSchema.parse(data);

		const insertedRoundIds: { id: number }[] = await tx.insert(round).values(parsedRound).returning({ id: round.id });

		const roundId = insertedRoundIds[0].id;

		if (!data.playerRecords || data.playerRecords.length === 0) {
			return;
		}

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
			if (!playerRecord.deaths || playerRecord.deaths.length === 0) {
				continue;
			}

			const parsedDeaths = z.array(insertDeathSchema).parse(
				playerRecord.deaths.map((death) => ({
					...death,
					playerRecordId: insertedPlayerRecordIds[index].id,
				})),
			);

			await tx.insert(death).values(parsedDeaths);
		}
	});
};

export const getRoundCount = async (fromDate: Date, toDate: Date) => {
	const result = await db
		.select({ count: count(round.id) })
		.from(round)
		.where(and(gte(round.startedAt, fromDate.toDateString()), lte(round.startedAt, toDate.toDateString())));

	return result.pop()?.count;
};

export const getRoundWinsByTeam = async (team: string, fromDate: Date, toDate: Date) => {
	const result = await db
		.select({ count: count(round.id) })
		.from(round)
		.where(
			and(
				eq(round.winningTeam, team),
				gte(round.startedAt, fromDate.toDateString()),
				lte(round.startedAt, toDate.toDateString()),
			),
		);

	return result.pop()?.count;
};
