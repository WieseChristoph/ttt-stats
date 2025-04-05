"use client";

import { getMapCount } from "@/actions/mapAction";
import { getRoundCount, getRoundWinsByTeam } from "@/actions/roundAction";
import { Team } from "@/enums/Team";
import { getTeamColor } from "@/lib/teamMapper";
import { MapIcon, Timer, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { StatCard } from "./StatCard";

interface HomeSingleValueStatsProps {
	dateRange?: DateRange;
}

export function HomeSingleValueStats({ dateRange }: HomeSingleValueStatsProps) {
	const [mapCount, setMapCount] = useState<number>(0);
	const [roundCount, setRoundCount] = useState<number>(0);
	const [innocentWins, setInnocentWins] = useState<number>(0);
	const [traitorWins, setTraitorWins] = useState<number>(0);

	const updateSingleValueStats = useCallback(() => {
		if (dateRange?.from && dateRange?.to) {
			getMapCount(dateRange.from, dateRange.to).then((result) => setMapCount(result ?? 0));

			getRoundCount(dateRange.from, dateRange.to).then((result) => setRoundCount(result ?? 0));

			getRoundWinsByTeam("innocents", dateRange.from, dateRange.to).then((result) => setInnocentWins(result ?? 0));

			getRoundWinsByTeam("traitors", dateRange.from, dateRange.to).then((result) => setTraitorWins(result ?? 0));
		} else {
			setMapCount(0);
			setRoundCount(0);
			setInnocentWins(0);
			setTraitorWins(0);
		}
	}, [dateRange]);

	useEffect(() => {
		updateSingleValueStats();
	});

	useEffect(() => {
		updateSingleValueStats();
	}, [updateSingleValueStats]);

	const singleNumberStats = useMemo(
		() => [
			{
				title: "Traitor Win Rate",
				description: "Success rate of traitors",
				value: `${roundCount > 0 ? ((traitorWins / roundCount) * 100).toFixed(1) : 0}%`,
				icon: <Users className="h-6 w-6" style={{ color: getTeamColor(Team.Traitors) }} />,
			},
			{
				title: "Innocent Win Rate",
				description: "Success rate of innocents",
				value: `${roundCount > 0 ? ((innocentWins / roundCount) * 100).toFixed(1) : 0}%`,
				icon: <Users className="h-6 w-6" style={{ color: getTeamColor(Team.Innocents) }} />,
			},
			{
				title: "Maps Played",
				description: "In selected period",
				value: mapCount,
				icon: <MapIcon className="h-6 w-6 text-amber-400" />,
			},
			{
				title: "Total Rounds",
				description: "In selected period",
				value: roundCount,
				icon: <Timer className="h-6 w-6 text-blue-400" />,
			},
		],
		[mapCount, roundCount, innocentWins, traitorWins],
	);

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
			{singleNumberStats.map((stat) => (
				<StatCard key={stat.title} {...stat} />
			))}
		</div>
	);
}
