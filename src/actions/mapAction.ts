"use server";

import { SortOption } from "@/components/MapSortAndSearch";
import { db } from "@/db/drizzle";
import { insertMapSchema, map, selectMapSchema } from "@/db/schema/map";
import { round } from "@/db/schema/round";
import {
	and,
	asc,
	avg,
	count,
	countDistinct,
	desc,
	eq,
	gte,
	like,
	lte,
	max,
	type SQL,
	sql,
} from "drizzle-orm";
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

export const getGroupedMaps = async (
	sortOption: SortOption,
	searchQuery: string,
) => {
	const results = await db
		.select({
			name: map.name,
			lastPlayed: max(round.endedAt).mapWith(Date),
			timesPlayed: count(map.id),
			avgRoundDuration: avg(
				sql`EXTRACT(EPOCH FROM (${round.endedAt} - ${round.startedAt}))`,
			).mapWith(Number),
		})
		.from(map)
		.where(
			searchQuery
				? like(map.name, `%${searchQuery.toLowerCase()}%`)
				: undefined,
		)
		.fullJoin(round, eq(map.id, round.mapId))
		.groupBy(map.name)
		.orderBy(getOrderBySortOption(sortOption));

	return results;
};

function getOrderBySortOption(sortOption: SortOption): SQL {
	switch (sortOption) {
		case SortOption.Recent:
			return desc(max(round.endedAt).mapWith(Date));
		case SortOption.Alpabetical:
			return asc(map.name);
		case SortOption.MostPlayed:
			return desc(count(map.id));
		case SortOption.Duration:
			return desc(
				avg(
					sql`EXTRACT(EPOCH FROM (${round.endedAt} - ${round.startedAt}))`,
				).mapWith(Number),
			);
	}
}
