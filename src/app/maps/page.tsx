"use client";

import { getGroupedMaps } from "@/actions/mapAction";
import { MapCard, type MapCardProps } from "@/components/MapCard";
import { MapSortAndSearch, SortOption } from "@/components/MapSortAndSearch";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

const MAPS_PAGE_SIZE = 15;

export default function MapsOverview() {
	const [sortOption, setSortOption] = useState(SortOption.Recent);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
	const [maps, setMaps] = useState<MapCardProps[]>([]);

	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const { ref, inView } = useInView();

	const isResetting = useRef(false);
	const prevSearchQuery = useRef("");
	const prevSortOption = useRef(sortOption);

	const resetMaps = useCallback(() => {
		isResetting.current = true;
		setPage(1);
		setHasMore(true);
		setMaps([]);
	}, []);

	const loadMoreMaps = useCallback(async () => {
		if (!hasMore || isLoading) return;

		setIsLoading(true);
		try {
			const results = await getGroupedMaps(
				sortOption,
				debouncedSearchQuery,
				MAPS_PAGE_SIZE,
				(page - 1) * MAPS_PAGE_SIZE,
			);

			if (isResetting.current) {
				setMaps(results);
				isResetting.current = false;
			} else {
				setMaps((prev) => [...prev, ...results]);
			}

			setHasMore(results.length === MAPS_PAGE_SIZE);
			if (results.length === MAPS_PAGE_SIZE) {
				setPage((prev) => prev + 1);
			}
		} catch (error) {
			console.error("Failed to load maps:", error);
		} finally {
			setIsLoading(false);
		}
	}, [hasMore, isLoading, sortOption, debouncedSearchQuery, page]);

	useEffect(() => {
		if ((inView || isResetting.current) && hasMore && !isLoading) {
			loadMoreMaps();
		}
	}, [inView, hasMore, isLoading, loadMoreMaps]);

	useEffect(() => {
		if (prevSearchQuery.current !== debouncedSearchQuery || prevSortOption.current !== sortOption) {
			resetMaps();
			prevSearchQuery.current = debouncedSearchQuery;
			prevSortOption.current = sortOption;
		}
	}, [debouncedSearchQuery, sortOption, resetMaps]);

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
					<MapCard key={`${map.name}-${sortOption}-${debouncedSearchQuery}`} {...map} />
				))}
			</div>
			{isLoading && (
				<div className="flex justify-center pb-4">
					<Loader2 className="animate-spin" />
				</div>
			)}
			{!isLoading && hasMore && (
				<div ref={ref} className="flex justify-center pb-4">
					<Loader2 className="animate-spin" />
				</div>
			)}
		</>
	);
}
