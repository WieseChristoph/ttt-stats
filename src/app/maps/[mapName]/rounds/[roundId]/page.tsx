"use client";

import { getRound } from "@/actions/roundAction";
import { KillFeed } from "@/components/KillFeed";
import { RoundSingleValueStats } from "@/components/RoundSingleValueStats";
import { StatChartCard } from "@/components/StatChartCard";
import type { RoundWithRelations } from "@/db/schema";
import { Loader2, Skull } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Round() {
	const { mapName, roundId } = useParams<{ mapName: string; roundId: string }>();

	const [round, setRound] = useState<RoundWithRelations>();

	useEffect(() => {
		getRound(Number(roundId)).then((result) => setRound(result));
	}, [roundId]);

	if (!round) {
		return (
			<div className="flex justify-center pb-4">
				<Loader2 className="animate-spin" />
			</div>
		);
	}

	return (
		<>
			<h2 className="text-3xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-6">
				Round {roundId} on {mapName}
			</h2>
			<RoundSingleValueStats round={round} />

			<div className="grid gap-8 md:grid-cols-2 mb-12">
				<StatChartCard
					title="Kill Feed"
					description="Chronological list of kills during the round"
					icon={<Skull className="h-6 w-6 text-red-600" />}
				>
					<KillFeed round={round} />
				</StatChartCard>
				<StatChartCard title="Dummy" description="Dummy" icon={<Skull className="h-6 w-6 text-red-600" />}>
					<div>Dummy</div>
				</StatChartCard>
			</div>
		</>
	);
}
