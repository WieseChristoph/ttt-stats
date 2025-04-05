import { getAllUniqueSteamIds } from "@/actions/playerRecord";
import { loadSteamUsersByIds } from "@/actions/steamUserAction";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
	const steamIds = await getAllUniqueSteamIds();

	if (steamIds.length === 0) return new Response(null, { status: 200 });

	try {
		await loadSteamUsersByIds(steamIds);
	} catch (error) {
		if (error instanceof ZodError) return new Response(JSON.stringify(error.errors), { status: 400 });

		return new Response(JSON.stringify(error), { status: 500 });
	}

	return new Response(null, { status: 200 });
}
