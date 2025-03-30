"use server";

import { db } from "@/db/drizzle";
import { insertMapSchema, map, selectMapSchema } from "@/db/schema/map";
import { round } from "@/db/schema/round";
import { and, countDistinct, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

export const getMaps = async () => {
	const data = await db.select().from(map);

	return z.array(selectMapSchema).parse(data);
};

export const getLatestMap = async () => {
	const data = await db.select().from(map).orderBy(desc(map.id)).limit(1);

	return z.optional(selectMapSchema).parse(data[0]);
};

export const addMap = async (name: string) => {
	const parsedMap = insertMapSchema.parse({ name });

	await db.insert(map).values(parsedMap);
};

export const getMapCount = async (fromDate: Date, toDate: Date) => {
	const result = await db
		.select({ count: countDistinct(map.id) })
		.from(map)
		.fullJoin(round, eq(map.id, round.mapId))
		.where(
			and(
				gte(map.startedAt, fromDate.toDateString()),
				lte(map.startedAt, toDate.toDateString()),
			),
		);

	return result.pop()?.count;
};
