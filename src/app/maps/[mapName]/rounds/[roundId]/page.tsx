export default async function Round({
	params,
}: { params: Promise<{ mapName: string; roundId: number }> }) {
	const { mapName, roundId } = await params;

	return (
		<div>
			Round {roundId} on {mapName}
		</div>
	);
}
