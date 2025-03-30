"use client";

import { getGroupedMaps } from "@/actions/mapAction";
import { MapCard, type MapCardProps } from "@/components/MapCard";
import { useEffect, useState } from "react";

export default function MapsOverview() {
	const [maps, setMaps] = useState<MapCardProps[]>([]);

	useEffect(() => {
		getGroupedMaps().then((result) => setMaps(result));
	}, []);

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{maps.map((map) => (
				<MapCard key={map.name} {...map} />
			))}
		</div>
	);
}
