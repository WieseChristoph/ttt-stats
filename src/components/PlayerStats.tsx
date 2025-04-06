import type { RoundWithRelations } from "@/db/schema";
import type { Team } from "@/enums/Team";
import { getTeamColor } from "@/lib/teamMapper";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import Image from "next/image";
import { cFirst } from "@/lib/utils";
import { Badge } from "./ui/badge";

dayjs.extend(duration);

interface PlayerStatsProps {
	round: RoundWithRelations;
}

export function PlayerStats({ round }: PlayerStatsProps) {
	const kills = useMemo(() => {
		const killsBySteamId: { [key: string]: { kills: number; teamKills: number } } = {};
		for (const playerRecord of round.playerRecords) {
			for (const death of playerRecord.deaths) {
				if (!death.attackerSteamId) continue;

				if (!killsBySteamId[death.attackerSteamId]) {
					killsBySteamId[death.attackerSteamId] = {
						kills: 1,
						teamKills: death.isTeamkill ? 1 : 0,
					};
				} else {
					killsBySteamId[death.attackerSteamId].kills += 1;
					killsBySteamId[death.attackerSteamId].teamKills += death.isTeamkill ? 1 : 0;
				}
			}
		}

		return killsBySteamId;
	}, [round]);

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<Table>
				<TableHeader className="sticky top-0 z-10 bg-zinc-900">
					<TableRow className="border-zinc-700 hover:bg-zinc-750">
						<TableHead className="w-[50px] text-zinc-400">Avatar</TableHead>
						<TableHead className="text-zinc-400">Player</TableHead>
						<TableHead className="text-zinc-400">Role</TableHead>
						<TableHead className="text-zinc-400">Kills</TableHead>
						<TableHead className="text-zinc-400">Team Kills</TableHead>
						<TableHead className="text-zinc-400">Deaths</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="text-zinc-100 flex-1 overflow-auto">
					{round.playerRecords.map((playerRecord) => (
						<TableRow key={playerRecord.id} className="border-zinc-700 hover:bg-zinc-750">
							<TableCell>
								<Image
									src={playerRecord.steamUser.avatarMedium ?? ""}
									alt={playerRecord.steamUser.username}
									width={40}
									height={40}
									className="rounded-full"
								/>
							</TableCell>
							<TableCell className="font-medium">{playerRecord.steamUser.username}</TableCell>
							<TableCell>
								<Badge style={{ backgroundColor: getTeamColor(playerRecord.teamName as Team) }}>
									{cFirst(playerRecord.teamName).slice(0, playerRecord.teamName.length - 1)}
								</Badge>
							</TableCell>
							<TableCell>{kills[playerRecord.steamId]?.kills ?? 0}</TableCell>
							<TableCell>{kills[playerRecord.steamId]?.teamKills ?? 0}</TableCell>
							<TableCell>{playerRecord.deaths.length}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
