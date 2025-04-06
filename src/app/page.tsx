"use client";

import { DateRangePicker } from "@/components/DateRangePicker";
import { HomeSingleValueStats } from "@/components/HomeSingleValueStats";
import { RoleWinRateChart } from "@/components/RoleWinRateChart";
import { StatChartCard } from "@/components/StatChartCard";
import { WeaponUsageChart } from "@/components/WeaponUsageChart";
import { addDays } from "date-fns";
import { Crown, Sword } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export default function Home() {
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: addDays(new Date(), -30),
		to: new Date(),
	});

	return (
		<>
			<div className="flex justify-between pb-4 items-center">
				<h2 className="text-2xl">Stats Overview</h2>
				<DateRangePicker dateRange={dateRange} onSelect={setDateRange} />
			</div>

			<HomeSingleValueStats dateRange={dateRange} />

			<div className="grid gap-8 md:grid-cols-2 mb-12">
				<StatChartCard
					title="Role Win Rates"
					description="Win percentage by role over time"
					icon={<Crown className="h-6 w-6 text-amber-400" />}
				>
					<RoleWinRateChart dateRange={dateRange} />
				</StatChartCard>
				<StatChartCard
					title="Weapon Usage"
					description="Most popular weapons by kill count"
					icon={<Sword className="h-6 w-6 text-red-400" />}
				>
					<WeaponUsageChart dateRange={dateRange} />
				</StatChartCard>
			</div>
		</>
	);
}
