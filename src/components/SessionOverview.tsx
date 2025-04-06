import type { MapWithRelations } from "@/db/schema";
import type { Team } from "@/enums/Team";
import { getTeamColor } from "@/lib/teamMapper";
import { cFirst } from "@/lib/utils";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

dayjs.extend(duration);

interface SessionOverviewProps {
	session: MapWithRelations;
	openSessions: number[];
	onToggleSession: (sessionId: number) => void;
}

export function SessionOverview({ session, openSessions, onToggleSession }: SessionOverviewProps) {
	const mostCommonWinner = useMemo(() => {
		const winsByTeams = session.rounds.reduce((prev: { [key: string]: number }, curr) => {
			prev[curr.winningTeam] = (prev[curr.winningTeam] ?? 0) + 1;

			return prev;
		}, {});

		return Object.entries(winsByTeams).reduce((currentMostCommonWinner, entry) => {
			return entry[1] > winsByTeams[currentMostCommonWinner] ? entry[0] : currentMostCommonWinner;
		}, Object.keys(winsByTeams)[0]);
	}, [session]);

	return (
		<Collapsible
			open={openSessions.includes(session.id)}
			className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800/50 backdrop-blur-sm"
		>
			<CollapsibleTrigger
				onClick={() => onToggleSession(session.id)}
				className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-700/30 transition-colors cursor-pointer"
			>
				<div className="flex items-center gap-3">
					<div className="rounded-full bg-zinc-700 p-2">
						<Calendar className="h-5 w-5 text-zinc-300" />
					</div>
					<div>
						<h4 className="text-lg font-medium text-zinc-100">
							{dayjs(session.startedAt).format("DD/MM/YYYY")} at {dayjs(session.startedAt).format("HH:mm")}
						</h4>
						<p className="text-sm text-zinc-400">
							{session.rounds.length} rounds •{" "}
							{dayjs
								.duration(
									dayjs(session.rounds[session.rounds.length - 1].endedAt).diff(
										dayjs(session.rounds[0].startedAt),
										"seconds",
									),
									"seconds",
								)
								.format("m[m] s[s]")}{" "}
							total • {Math.max(...session.rounds.map((round) => round.playerRecords.length))} players
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span style={{ color: getTeamColor(mostCommonWinner as Team) }}>{cFirst(mostCommonWinner)}</span>
					{openSessions.includes(session.id) ? (
						<ChevronUp className="h-5 w-5 text-zinc-400" />
					) : (
						<ChevronDown className="h-5 w-5 text-zinc-400" />
					)}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="border-t border-zinc-700 p-4">
					<Table>
						<TableHeader>
							<TableRow className="border-zinc-700 hover:bg-zinc-750">
								<TableHead className="text-zinc-400">Round #</TableHead>
								<TableHead className="text-zinc-400">Duration</TableHead>
								<TableHead className="text-zinc-400">Winner</TableHead>
								<TableHead className="text-zinc-400">Players</TableHead>
								<TableHead className="text-zinc-400 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{session.rounds.map((round, index) => (
								<TableRow key={round.id} className="border-zinc-700 hover:bg-zinc-750">
									<TableCell className="font-medium">Round {index + 1}</TableCell>
									<TableCell>
										{dayjs
											.duration(dayjs(round.endedAt).diff(dayjs(round.startedAt), "seconds"), "seconds")
											.format("m[m] s[s]")}
									</TableCell>
									<TableCell>
										<Badge
											style={{
												backgroundColor: getTeamColor(round.winningTeam as Team),
											}}
										>
											{cFirst(round.winningTeam)}
										</Badge>
									</TableCell>
									<TableCell className="text-right flex gap-1">
										{round.playerRecords.map((playerRecord) => (
											<TooltipProvider key={playerRecord.id}>
												<Tooltip>
													<TooltipTrigger asChild>
														<Link href={`/players/${playerRecord.steamId}`}>
															<Image
																key={playerRecord.id}
																src={playerRecord.steamUser.avatar ?? ""}
																alt={playerRecord.steamUser.username}
																width={24}
																height={24}
																className="rounded-xl border-2"
																style={{ borderColor: getTeamColor(playerRecord.teamName as Team) }}
															/>
														</Link>
													</TooltipTrigger>
													<TooltipContent>
														<p>{`${playerRecord.steamUser.username} (${cFirst(playerRecord.teamName).slice(0, playerRecord.teamName.length - 1)})`}</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										))}
									</TableCell>
									<TableCell className="text-right">
										<Link
											href={`/maps/${session.name}/rounds/${round.id}`}
											className="text-sm text-blue-400 hover:underline"
										>
											View Details
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
