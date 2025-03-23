export default async function MapInfo({
	params,
}: { params: Promise<{ mapName: string }> }) {
	const { mapName } = await params;

	return <div>Single Map {mapName}</div>;
}
