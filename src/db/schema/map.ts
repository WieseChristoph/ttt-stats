import { relations } from "drizzle-orm";
import {
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { round } from "./round";

export const map = pgTable("map", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	startedAt: timestamp("started_at").notNull(),
});

export const mapRelations = relations(map, ({ many }) => ({
	rounds: many(round),
}));

export const selectMapSchema = createSelectSchema(map);

export const insertMapSchema = createInsertSchema(map);
