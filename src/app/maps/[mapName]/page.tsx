"use client";

import { getMapSessionsByName } from "@/actions/mapAction";
import { MapSingleValueStats } from "@/components/MapSingleValueStats";
import { SessionOverview } from "@/components/SessionOverview";
import type { MapWithRounds } from "@/db/schema";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MapInfo() {
	const { mapName } = useParams<{ mapName: string }>();

	const [openSessions, setOpenSessions] = useState<number[]>([]);
	const [sessions, setSessions] = useState<MapWithRounds[]>([]);

	useEffect(() => {
		getMapSessionsByName(mapName).then((results) => {
			setSessions(results);
			setOpenSessions([results[0].id]);
		});
	}, [mapName]);

	const toggleSession = (sessionId: number) => {
		setOpenSessions((prev) =>
			prev.includes(sessionId)
				? prev.filter((id) => id !== sessionId)
				: [...prev, sessionId],
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
			</div>
		</>
	);
}
