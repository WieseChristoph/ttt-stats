"use client";

import type { RoundWithRelations } from "@/db/schema";
import type { Team } from "@/enums/Team";
import { getTeamColor } from "@/lib/teamMapper";
import { cFirst } from "@/lib/utils";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Clock, Medal, Timer } from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "./StatCard";

dayjs.extend(duration);

interface RoundSingleValueStatsProps {
	round: RoundWithRelations;
}

export function RoundSingleValueStats({ round }: RoundSingleValueStatsProps) {
	const singleNumberStats = useMemo(
		() => [
			{
				title: "Start Time",
				description: "The time this round started",
				value: dayjs(round.startedAt).format("DD/MM/YYYY - HH:mm:ss"),
				icon: <Clock className="h-6 w-6 text-amber-400" />,
			},
			{
				title: "Duration",
				description: "How long the round lasted",
				value: dayjs
					.duration(dayjs(round.endedAt).diff(dayjs(round.startedAt), "seconds"), "seconds")
					.format("m[m] s[s]"),
				icon: <Timer className="h-6 w-6 text-green-400" />,
			},
			{
				title: "Winner",
				description: "Which team won",
				value: cFirst(round.winningTeam),
				icon: <Medal className="h-6 w-6" style={{ color: getTeamColor(round.winningTeam as Team) }} />,
			},
		],
		[round],
	);

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
			{singleNumberStats.map((stat) => (
				<StatCard key={stat.title} {...stat} />
			))}
		</div>
	);
}
