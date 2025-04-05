import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
import { pgTable, serial, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { playerRecord } from "./playerRecord";

export const steamUser = pgTable(
	"steam_user",
	{
		id: serial("id").primaryKey(),
		steamId: varchar("steam_id", { length: 17 }).notNull(),
		username: varchar("username", { length: 255 }).notNull(),
		profileUrl: varchar("profile_url", { length: 255 }).notNull(),
		avatar: varchar("avatar", { length: 255 }),
		avatarMedium: varchar("avatar_medium", { length: 255 }),
		avatarFull: varchar("avatar_full", { length: 255 }),
	},
	(table) => [uniqueIndex("steamIdUniqueIndex").on(table.steamId)],
);

export const steamUserRelations = relations(steamUser, ({ one, many }) => ({
	playerRecord: one(playerRecord, {
		fields: [steamUser.steamId],
		references: [playerRecord.steamId],
	}),
}));

export type SteamUser = InferSelectModel<typeof steamUser>;

export type NewSteamUser = InferInsertModel<typeof steamUser>;

export const selectSteamUserSchema = createSelectSchema(steamUser);

export const insertSteamUserSchema = createInsertSchema(steamUser);
