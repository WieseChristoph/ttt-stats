"use server";

import { db } from "@/db/drizzle";
import { insertMapSchema, map, selectMapSchema } from "@/db/schema/map";
import { z } from "zod";

export const getMaps = async () => {
	const data = await db.select().from(map);

	return z.array(selectMapSchema).parse(data);
};

export const addMap = async (name: string) => {
	const parsedMap = insertMapSchema.parse({ name });

	await db.insert(map).values(parsedMap);
};
