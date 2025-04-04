"use client";

import {
	getMapSingleValueStats,
	getMostCommonWinner,
} from "@/actions/mapAction";
import { cFirst } from "@/lib/utils";
import dayjs from "dayjs";
import { Award, Calendar, Clock, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "./StatCard";

interface MapSingleValueStatsProps {
	mapName: string;
}

export function MapSingleValueStats({ mapName }: MapSingleValueStatsProps) {
	const [firstPlayed, setFirstPlayed] = useState<string | null>(null);
	const [timesPlayed, setTimesPlayed] = useState<number>(0);
	const [totalrounds, setTotalrounds] = useState<number>(0);
	const [mostCommonWinner, setMostCommonWinner] = useState<string>("");

	useEffect(() => {
		getMapSingleValueStats(mapName).then((result) => {
			if (!result) {
				return;
			}

			setFirstPlayed(result.firstTimePlayed);
			setTimesPlayed(result.timesPlayed);
			setTotalrounds(result.totalRounds);
		});

		getMostCommonWinner(mapName).then((result) => {
			if (!result) {
				return;
			}

			const teamName = result.team ? cFirst(result.team) : "";

			setMostCommonWinner(`${teamName} (${result.winPercentage.toFixed(1)}%)`);
		});
	}, [mapName]);

	const singleNumberStats = useMemo(
		() => [
			{
				title: "First Played",
				description: "The first time this map was played",
				value: dayjs(firstPlayed).format("DD/MM/YYYY - HH:mm:ss"),
				icon: <Calendar className="h-6 w-6 text-red-400" />,
				iconBg: "bg-red-900/30",
			},
			{
				title: "Times played",
				description: "How often the map was played",
				value: timesPlayed,
				icon: <Clock className="h-6 w-6 text-green-400" />,
				iconBg: "bg-green-900/30",
			},
			{
				title: "Total Rounds",
				description: "Amount of rounds played",
				value: totalrounds,
				icon: <Users className="h-6 w-6 text-amber-400" />,
				iconBg: "bg-amber-900/30",
			},
			{
				title: "Most Common Winner",
				description: "Which role has the most wins on this map",
				value: mostCommonWinner,
				icon: <Award className="h-6 w-6 text-blue-400" />,
				iconBg: "bg-blue-900/30",
			},
		],
		[firstPlayed, timesPlayed, totalrounds, mostCommonWinner],
	);

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
			{singleNumberStats.map((stat) => (
				<StatCard key={stat.title} {...stat} />
			))}
		</div>
	);
}
