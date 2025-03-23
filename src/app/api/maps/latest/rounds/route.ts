import { getLatestMap } from "@/actions/mapAction";
import { addRound } from "@/actions/roundAction";
import type { ApiRound } from "@/types/api/Round";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

export async function PUT(request: NextRequest) {
	const latestMap = await getLatestMap();

	if (!latestMap)
		return new Response("There is no map to add a round to", { status: 400 });

	const body = await request.json();
	const round = { ...body, mapId: latestMap.id } as ApiRound;

	try {
		await addRound(round);
	} catch (error) {
		if (error instanceof ZodError)
			return new Response(JSON.stringify(error.errors), { status: 400 });

		return new Response(JSON.stringify(error), { status: 500 });
	}

	return new Response(null, { status: 201 });
}
