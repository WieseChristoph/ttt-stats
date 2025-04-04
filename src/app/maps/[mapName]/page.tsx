import { MapSingleValueStats } from "@/components/MapSingleValueStats";

export default async function MapInfo({
	params,
}: { params: Promise<{ mapName: string }> }) {
	const { mapName } = await params;

	return (
		<>
			<h2 className="text-3xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-6">
				{mapName}
			</h2>
			<MapSingleValueStats mapName={mapName} />
		</>
	);
}
