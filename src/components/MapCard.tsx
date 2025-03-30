import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { BarChart2, Clock } from "lucide-react";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export interface MapCardProps {
	name: string | null;
	lastPlayed: string;
	timesPlayed: number;
	avgRoundDuration: number;
}

export function MapCard({
	name,
	lastPlayed,
	timesPlayed,
	avgRoundDuration,
}: MapCardProps) {
	return (
		<Link href={`/maps/${name}`} className="block group">
			<Card className="h-full border-zinc-700 bg-zinc-800/50 overflow-hidden transition-all duration-100 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-zinc-900/50">
				<CardHeader className="pb-2">
					<div className="flex justify-between items-start">
						<div>
							<CardTitle className="text-lg text-zinc-100">{name}</CardTitle>
							<CardDescription className="text-zinc-400">
								Last played {dayjs(lastPlayed).format("DD/MM/YYYY - HH:mm:ss")}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4 text-sm text-zinc-300">
						<div className="flex items-center gap-1.5">
							<BarChart2 className="h-4 w-4 text-zinc-400" />
							<span>
								Played {timesPlayed} {timesPlayed > 1 ? "times" : "time"}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Clock className="h-4 w-4 text-zinc-400" />
							<span>
								Avg. Round:{" "}
								{dayjs.duration(avgRoundDuration, "seconds").format("mm:ss")}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
