import { Input } from "./ui/input";
import { Search } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export enum SortOption {
	Recent = "recent",
	Alpabetical = "alphabetical",
	MostPlayed = "mostPlayed",
	Duration = "duration",
}

interface MapSortAndSearchProps {
	sortOption: SortOption;
	onSortOptionChange: (sortOption: SortOption) => void;
	searchQuery: string;
	onSearchQueryChange: (searchQuery: string) => void;
}

export function MapSortAndSearch({
	sortOption,
	onSortOptionChange,
	searchQuery,
	onSearchQueryChange,
}: MapSortAndSearchProps) {
	return (
		<>
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
				<div className="relative w-full md:w-64">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
					<Input
						placeholder="Search maps..."
						className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100"
						value={searchQuery}
						onChange={(e) => onSearchQueryChange(e.target.value)}
					/>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-zinc-400 text-sm">Sort by:</span>
					<Select value={sortOption} onValueChange={onSortOptionChange}>
						<SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-100">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
							<SelectItem value={SortOption.Recent}>Recently Played</SelectItem>
							<SelectItem value={SortOption.Alpabetical}>
								Alphabetical
							</SelectItem>
							<SelectItem value={SortOption.MostPlayed}>Most Played</SelectItem>
							<SelectItem value={SortOption.Duration}>
								Round Duration
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</>
	);
}
