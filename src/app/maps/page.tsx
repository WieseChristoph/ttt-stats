"use client";

import { getGroupedMaps } from "@/actions/mapAction";
import { MapCard, type MapCardProps } from "@/components/MapCard";
import { MapSortAndSearch, SortOption } from "@/components/MapSortAndSearch";
import { useEffect, useState } from "react";

export default function MapsOverview() {
	const [sortOption, setSortOption] = useState(SortOption.Recent);
	const [searchQuery, setSearchQuery] = useState("");
	const [maps, setMaps] = useState<MapCardProps[]>([]);

	useEffect(() => {
		getGroupedMaps(sortOption, searchQuery).then((result) => setMaps(result));
	}, [sortOption, searchQuery]);

	return (
		<>
			<MapSortAndSearch
				sortOption={sortOption}
				onSortOptionChange={setSortOption}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
			/>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-4">
				{maps.map((map) => (
					<MapCard key={map.name} {...map} />
				))}
			</div>
		</>
	);
}
