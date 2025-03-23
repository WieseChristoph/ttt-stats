import { getMaps } from "@/actions/mapAction";

export default async function MapsOverview() {
	const maps = await getMaps();

	return (
		<div>
			{maps.map((map) => (
				<h3 key={map.id}>{map.name}</h3>
			))}
		</div>
	);
}
