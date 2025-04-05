import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type Round, round } from "./round";

export const map = pgTable("map", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	startedAt: timestamp("started_at", { mode: "string" }).notNull().defaultNow(),
});

export const mapRelations = relations(map, ({ many }) => ({
	rounds: many(round),
}));

export type Map = InferSelectModel<typeof map>;

export type NewMap = InferInsertModel<typeof map>;

export type MapWithRounds = Map & { rounds: Round[] };

export const selectMapSchema = createSelectSchema(map);

export const insertMapSchema = createInsertSchema(map);
