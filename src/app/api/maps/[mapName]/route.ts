import { addMap } from "@/actions/mapAction";

export async function PUT({
	params,
}: { params: Promise<{ mapName: string }> }) {
	const { mapName } = await params;

	await addMap(mapName);

	return new Response(null, { status: 201 });
}
