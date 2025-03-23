import { addMap } from "@/actions/mapAction";
import type { NextRequest } from "next/server";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ mapName: string }> },
) {
	const { mapName } = await params;

	try {
		await addMap(mapName);
	} catch (error) {
		return new Response(JSON.stringify(error), { status: 500 });
	}

	return new Response(null, { status: 201 });
}
