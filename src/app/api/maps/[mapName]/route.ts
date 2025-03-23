import { addMap } from "@/actions/mapAction";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ mapName: string }> },
) {
	const { mapName } = await params;

	try {
		await addMap(mapName);
	} catch (error) {
		if (error instanceof ZodError)
			return new Response(JSON.stringify(error.errors), { status: 400 });

		return new Response(JSON.stringify(error), { status: 500 });
	}

	return new Response(null, { status: 201 });
}
