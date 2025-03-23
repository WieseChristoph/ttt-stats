export default async function PlayerInfo({
	params,
}: { params: Promise<{ playerId: number }> }) {
	const { playerId } = await params;

	return <div>Player info of {playerId}</div>;
}
