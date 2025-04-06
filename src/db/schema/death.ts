import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { playerRecord } from "./playerRecord";
import { type SteamUser, steamUser } from "./steamUser";

export const death = pgTable("death", {
	id: serial("id").primaryKey(),
	playerRecordId: integer("player_record_id")
		.references(() => playerRecord.id)
		.notNull(),
	attackerSteamId: varchar("attacker_steam_id", { length: 17 }),
	isTeamkill: boolean("is_teamkill").notNull().default(false),
	inflictor: varchar("inflictor", { length: 255 }),
	hitgroup: integer("hitgroup"),
	timeOfDeath: timestamp("time_of_death", { mode: "string" }),
});

export const deathRelations = relations(death, ({ one }) => ({
	playerRecord: one(playerRecord, {
		fields: [death.playerRecordId],
		references: [playerRecord.id],
	}),
	attackerSteamUser: one(steamUser, {
		fields: [death.attackerSteamId],
		references: [steamUser.steamId],
	}),
}));

export type Death = InferSelectModel<typeof death>;

export type NewDeath = InferInsertModel<typeof death>;

export type DeathWithRelations = Death & { attackerSteamUser: SteamUser };

export const selectDeathSchema = createSelectSchema(death);

export const insertDeathSchema = createInsertSchema(death, {
	hitgroup: (schema) =>
		schema
			.gte(0)
			.lte(7)
			.or(schema.refine((hitgroup) => hitgroup === 10)),
});
