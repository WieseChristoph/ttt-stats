import { type InferSelectModel, relations } from "drizzle-orm";
import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { death } from "./death";
import { round } from "./round";

export const playerRecord = pgTable("player_record", {
	id: serial("id").primaryKey(),
	roundId: integer("round_id")
		.references(() => round.id)
		.notNull(),
	steamId: varchar("steam_id", { length: 17 }).notNull(),
	teamName: varchar("team_name", { length: 255 }).notNull(),
});

export const roundRelations = relations(playerRecord, ({ one, many }) => ({
	round: one(round, {
		fields: [playerRecord.roundId],
		references: [round.id],
	}),
	deaths: many(death),
}));

export type PlayerRecord = InferSelectModel<typeof playerRecord>;

export const selectPlayerRecordSchema = createSelectSchema(playerRecord);

export const insertPlayerRecordSchema = createInsertSchema(playerRecord);
