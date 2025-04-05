"use server";

import { db } from "@/db/drizzle";
import { death } from "@/db/schema/death";
import { playerRecord } from "@/db/schema/playerRecord";
import { round } from "@/db/schema/round";
import { and, count, countDistinct, desc, eq, gte, isNotNull, lte } from "drizzle-orm";

export const getKillsByInflictor = async (fromDate: Date, toDate: Date, limit: number) => {
	const result = await db
		.select({ inflictor: death.inflictor, kills: countDistinct(death.id) })
		.from(death)
		.innerJoin(playerRecord, eq(death.playerRecordId, playerRecord.id))
		.innerJoin(round, eq(playerRecord.roundId, round.id))
		.where(
			and(
				gte(round.startedAt, fromDate.toDateString()),
				lte(round.startedAt, toDate.toDateString()),
				isNotNull(death.inflictor),
			),
		)
		.groupBy(death.inflictor)
		.orderBy(desc(count(death.id)))
		.limit(limit);

	return result;
};
