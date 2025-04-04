import { type ClassValue, clsx } from "clsx";
import { type SQL, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function buildConflictUpdateColumns<
	T extends PgTable,
	Q extends keyof T["_"]["columns"],
>(table: T, columns: Q[]) {
	const cls = getTableColumns(table);

	return columns.reduce(
		(acc, column) => {
			const colName = cls[column].name;
			acc[column] = sql.raw(`excluded.${colName}`);

			return acc;
		},
		{} as Record<Q, SQL>,
	);
}

export function cFirst(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
