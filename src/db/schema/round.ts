import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { map } from "./map";
import { playerRecord } from "./playerRecord";

export const round = pgTable("round", {
	id: serial("id").primaryKey(),
	mapId: integer("map_id")
		.references(() => map.id)
		.notNull(),
	startedAt: timestamp("started_at").notNull(),
	endedAt: timestamp("ended_at").notNull(),
	winningTeam: varchar("winning_team", { length: 255 }).notNull(),
});

export const roundRelations = relations(round, ({ one, many }) => ({
	map: one(map, {
		fields: [round.mapId],
		references: [map.id],
	}),
	playerRecords: many(playerRecord),
}));

export const selectRoundSchema = createSelectSchema(round);

export const insertRoundSchema = createInsertSchema(round);
