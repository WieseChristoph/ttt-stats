import { getAllUniqueSteamIds } from "@/actions/playerRecord";
import { upsertSteamUsers } from "@/actions/steamUserAction";
import type { NewSteamUser } from "@/db/schema/steamUser";
import { getSteamDataByIds } from "@/lib/steam";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
	const steamIds = await getAllUniqueSteamIds();

	if (steamIds.length === 0) return new Response(null, { status: 200 });

	try {
		const steamUsers = await getSteamDataByIds(steamIds);

		if (steamUsers.length === 0) return new Response(null, { status: 200 });

		const mappedSteamUsers = steamUsers.map(
			(steamUser) =>
				({
					steamId: steamUser.steamid,
					username: steamUser.personaname,
					profileUrl: steamUser.profileurl,
					avatar: steamUser.avatar,
					avatarMedium: steamUser.avatarmedium,
					avatarFull: steamUser.avatarfull,
				}) as NewSteamUser,
		);

		await upsertSteamUsers(mappedSteamUsers);
	} catch (error) {
		if (error instanceof ZodError)
			return new Response(JSON.stringify(error.errors), { status: 400 });

		return new Response(JSON.stringify(error), { status: 500 });
	}

	return new Response(null, { status: 200 });
}
