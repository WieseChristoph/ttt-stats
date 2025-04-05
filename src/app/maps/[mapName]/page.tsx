"use client";

import { getMapSessionsByName } from "@/actions/mapAction";
import { MapSingleValueStats } from "@/components/MapSingleValueStats";
import { SessionOverview } from "@/components/SessionOverview";
import type { MapWithRounds } from "@/db/schema";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

const SESSION_PAGE_SIZE = 5;

export default function MapInfo() {
	const { mapName } = useParams<{ mapName: string }>();

	const [sessions, setSessions] = useState<MapWithRounds[]>([]);
	const [openSessions, setOpenSessions] = useState<number[]>([]);

	const [page, setPage] = useState<number>(1);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState(false);
	const { ref, inView } = useInView();

	const loadMoreSessions = useCallback(async () => {
		if (!hasMore || isLoading) return;

		setIsLoading(true);
		try {
			const results = await getMapSessionsByName(mapName, SESSION_PAGE_SIZE, (page - 1) * SESSION_PAGE_SIZE);

			setSessions((prev) => [...prev, ...results]);
			setOpenSessions((prev) => (prev.length === 0 ? [results[0].id] : prev));

			setHasMore(results.length === SESSION_PAGE_SIZE);
			if (results.length === SESSION_PAGE_SIZE) {
				setPage((prev) => prev + 1);
			}
		} catch (error) {
			console.error("Failed to load sessions:", error);
		} finally {
			setIsLoading(false);
		}
	}, [mapName, hasMore, isLoading, page]);

	useEffect(() => {
		if (inView && hasMore && !isLoading) {
			loadMoreSessions();
		}
	}, [inView, hasMore, isLoading, loadMoreSessions]);

	const toggleSession = (sessionId: number) => {
		setOpenSessions((prev) =>
			prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
		);
	};

	return (
		<>
			<h2 className="text-3xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-6">
				{mapName}
			</h2>
			<MapSingleValueStats mapName={mapName} />

			<h3 className="text-xl font-bold text-zinc-100">Sessions</h3>
			<div className="py-4 gap-4 flex flex-col">
				{sessions.map((session) => (
					<SessionOverview
						key={session.id}
						session={session}
						openSessions={openSessions}
						onToggleSession={toggleSession}
					/>
				))}
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
			</div>
		</>
	);
}
