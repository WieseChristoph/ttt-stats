import type { RoundWithRelations } from "@/db/schema";
import { Hitgroup } from "@/enums/Hitgroup";
import type { Team } from "@/enums/Team";
import { getTeamColor } from "@/lib/teamMapper";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { ArrowDown } from "lucide-react";
import { useMemo } from "react";
import { HeadshotIcon } from "./HeadshotIcon";

dayjs.extend(duration);

interface KillFeedProps {
	round: RoundWithRelations;
}

export function KillFeed({ round }: KillFeedProps) {
	const kills = useMemo(() => {
		const deaths = [];
		for (const playerRecord of round.playerRecords) {
			for (const death of playerRecord.deaths) {
				deaths.push({
					...death,
					victimSteamUser: playerRecord.steamUser,
					victimTeam: playerRecord.teamName,
					attackerTeam: round.playerRecords.find((pr) => pr.steamId === death.attackerSteamId)?.teamName,
				});
			}
		}

		console.log(deaths);

		return deaths.sort((deathA, deathB) => dayjs(deathA.timeOfDeath).diff(dayjs(deathB.timeOfDeath)));
	}, [round]);

	return (
		<div className="divide-y divide-zinc-700/50 overflow-y-auto h-full">
			{kills.map((kill) => (
				<div key={kill.id} className="p-3 hover:bg-zinc-700/20 transition-colors">
					<div className="flex items-center justify-between mb-1">
						<div className="flex items-center gap-2">
							<span
								className="inline-block w-2 h-2 rounded-full bg-zinc-300"
								style={kill.attackerTeam ? { backgroundColor: getTeamColor(kill.attackerTeam as Team) } : {}}
							/>
							<span
								className="font-medium text-zinc-300"
								style={kill.attackerTeam ? { color: getTeamColor(kill.attackerTeam as Team) } : {}}
							>
								{kill.attackerSteamUser?.username ?? "Unknown"}
							</span>
						</div>
						{kill.timeOfDeath && (
							<span className="text-xs text-zinc-400">
								{dayjs
									.duration(dayjs(kill.timeOfDeath).diff(round.startedAt, "seconds"), "seconds")
									.format("m[m] s[s]")}
							</span>
						)}
					</div>

					<div className="flex items-center gap-2 ml-4">
						<ArrowDown className="h-4 w-4 text-zinc-300" />

						<div className="flex-1 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-zinc-300 text-sm">killed</span>
								<span
									className="inline-block w-2 h-2 rounded-full"
									style={{ backgroundColor: getTeamColor(kill.victimTeam as Team) }}
								/>
								<span className="font-medium" style={{ color: getTeamColor(kill.victimTeam as Team) }}>
									{kill.victimSteamUser.username}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-zinc-400 text-sm italic">{kill.inflictor}</span>
								{kill.hitgroup === Hitgroup.Head && <HeadshotIcon className="h-6 w-6" />}
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
