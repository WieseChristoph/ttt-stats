"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange, SelectRangeEventHandler } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
	dateRange: DateRange | undefined;
	onSelect: SelectRangeEventHandler;
	className?: string;
}

export function DateRangePicker({ dateRange, onSelect, className }: DateRangePickerProps) {
	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={"outline"}
						className={cn(
							"w-[300px] justify-start text-left font-normal bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700",
							!dateRange && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{dateRange?.from ? (
							dateRange.to ? (
								<>
									{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
								</>
							) : (
								format(dateRange.from, "LLL dd, y")
							)
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0 bg-zinc-800 border-zinc-700" align="start">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={dateRange?.from}
						selected={dateRange}
						onSelect={onSelect}
						numberOfMonths={2}
						className="bg-zinc-800 text-zinc-100"
						disabled={{ after: new Date() }}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
