import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ReactNode } from "react";

interface StatCardProps {
	title: string;
	description: string;
	value: string | number;
	icon: ReactNode;
	iconBg: string;
	cardClass: string;
}

export function StatCard({
	title,
	description,
	value,
	icon,
	iconBg,
	cardClass = "",
}: StatCardProps) {
	return (
		<Card className={`${cardClass} border-zinc-700 overflow-hidden`}>
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="space-y-1">
					<CardTitle className="text-base font-medium">{title}</CardTitle>
					<CardDescription className="text-zinc-400">
						{description}
					</CardDescription>
				</div>
				<div className={`rounded-full ${iconBg} p-2`}>{icon}</div>
			</CardHeader>
			<CardContent>
				<div className="stat-value text-3xl font-bold">{value}</div>
			</CardContent>
		</Card>
	);
}
