import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface StatChartCardProps {
	title: string;
	description: string;
	icon: ReactNode;
	children?: ReactNode;
}

export function StatChartCard({ title, description, icon, children }: StatChartCardProps) {
	return (
		<Card className="border-zinc-700 bg-zinc-800/50 backdrop-blur-sm overflow-hidden">
			<CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-zinc-700/50">
				<div>
					<CardTitle className="text-xl font-medium text-zinc-100">{title}</CardTitle>
					<CardDescription className="text-zinc-400">{description}</CardDescription>
				</div>
				<div className="rounded-full bg-zinc-700/50 p-2">{icon}</div>
			</CardHeader>
			<CardContent className="h-[300px]">{children}</CardContent>
		</Card>
	);
}
