import { type InferInsertModel, type InferSelectModel, relations, sql } from 'drizzle-orm';
import {
    boolean,
    check,
    index,
    integer,
    pgEnum,
    pgTable,
    real,
    serial,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const StatsRoundEventTypeEnum = pgEnum('stats_round_event_type', ['death', 'role_change', 'revival']);

export const statsMap = pgTable(
    'stats_map',
    {
        id: serial('id').primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
        createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [uniqueIndex('stats_map_name_unique').on(table.name)],
);

export const statsSession = pgTable(
    'stats_session',
    {
        id: serial('id').primaryKey(),
        mapId: integer('map_id')
            .references(() => statsMap.id, { onDelete: 'cascade' })
            .notNull(),
        sessionKey: varchar('session_key', { length: 255 }).notNull(),
        startedAt: timestamp('started_at', { mode: 'string', withTimezone: true }).notNull(),
        endedAt: timestamp('ended_at', { mode: 'string', withTimezone: true }),
    },
    (table) => [
        uniqueIndex('stats_session_key_unique').on(table.sessionKey),
        index('stats_session_map_id_idx').on(table.mapId),
    ],
);

export const statsRound = pgTable(
    'stats_round',
    {
        id: serial('id').primaryKey(),
        sessionId: integer('session_id')
            .references(() => statsSession.id, { onDelete: 'cascade' })
            .notNull(),
        roundKey: varchar('round_key', { length: 255 }).notNull(),
        startedAt: timestamp('started_at', { mode: 'string', withTimezone: true }).notNull(),
        endedAt: timestamp('ended_at', { mode: 'string', withTimezone: true }).notNull(),
        winningTeam: varchar('winning_team', { length: 255 }).notNull(),
        winningSubrole: varchar('winning_subrole', { length: 255 }),
        telemetryVersion: integer('telemetry_version').notNull().default(1),
    },
    (table) => [
        uniqueIndex('stats_round_session_key_unique').on(table.sessionId, table.roundKey),
        index('stats_round_started_at_idx').on(table.startedAt),
    ],
);

export const statsPlayer = pgTable(
    'stats_player',
    {
        id: serial('id').primaryKey(),
        steamId: varchar('steam_id', { length: 17 }).notNull(),
    },
    (table) => [uniqueIndex('stats_player_steam_id_unique').on(table.steamId)],
);

export const statsRoundPlayer = pgTable(
    'stats_round_player',
    {
        id: serial('id').primaryKey(),
        roundId: integer('round_id')
            .references(() => statsRound.id, { onDelete: 'cascade' })
            .notNull(),
        playerId: integer('player_id')
            .references(() => statsPlayer.id, { onDelete: 'cascade' })
            .notNull(),
        initialTeamName: varchar('initial_team_name', { length: 255 }).notNull(),
        initialSubroleName: varchar('initial_subrole_name', { length: 255 }),
        finalTeamName: varchar('final_team_name', { length: 255 }).notNull(),
        finalSubroleName: varchar('final_subrole_name', { length: 255 }),
        joinedAt: timestamp('joined_at', { mode: 'string', withTimezone: true }),
        leftAt: timestamp('left_at', { mode: 'string', withTimezone: true }),
        kills: integer('kills').notNull().default(0),
        deaths: integer('deaths').notNull().default(0),
        teamKills: integer('team_kills').notNull().default(0),
        damageDealt: real('damage_dealt'),
        damageTaken: real('damage_taken'),
        shotsFired: integer('shots_fired'),
        shotsHit: integer('shots_hit'),
        survivalSeconds: real('survival_seconds'),
    },
    (table) => [
        uniqueIndex('stats_round_player_unique').on(table.roundId, table.playerId),
        index('stats_round_player_player_id_idx').on(table.playerId),
    ],
);

export const statsRoundEvent = pgTable(
    'stats_round_event',
    {
        id: serial('id').primaryKey(),
        roundId: integer('round_id')
            .references(() => statsRound.id, { onDelete: 'cascade' })
            .notNull(),
        sequence: integer('sequence').notNull(),
        type: StatsRoundEventTypeEnum('type').notNull(),
        occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }),
        legacyKey: varchar('legacy_key', { length: 255 }),
    },
    (table) => [
        uniqueIndex('stats_round_event_sequence_unique').on(table.roundId, table.sequence),
        uniqueIndex('stats_round_event_legacy_key_unique').on(table.legacyKey),
        index('stats_round_event_round_occurred_at_idx').on(table.roundId, table.occurredAt),
        check('stats_round_event_sequence_positive', sql`${table.sequence} > 0`),
    ],
);

export const statsDeath = pgTable(
    'stats_death',
    {
        eventId: integer('event_id')
            .references(() => statsRoundEvent.id, { onDelete: 'cascade' })
            .primaryKey(),
        victimPlayerId: integer('victim_player_id')
            .references(() => statsPlayer.id)
            .notNull(),
        attackerPlayerId: integer('attacker_player_id').references(() => statsPlayer.id),
        victimTeamName: varchar('victim_team_name', { length: 255 }).notNull(),
        victimSubroleName: varchar('victim_subrole_name', { length: 255 }),
        attackerTeamName: varchar('attacker_team_name', { length: 255 }),
        attackerSubroleName: varchar('attacker_subrole_name', { length: 255 }),
        isTeamkill: boolean('is_teamkill').notNull().default(false),
        inflictor: varchar('inflictor', { length: 255 }),
        hitgroup: integer('hitgroup'),
    },
    (table) => [
        index('stats_death_attacker_player_id_idx').on(table.attackerPlayerId),
        index('stats_death_victim_player_id_idx').on(table.victimPlayerId),
    ],
);

export const statsRoleChange = pgTable('stats_role_change', {
    eventId: integer('event_id')
        .references(() => statsRoundEvent.id, { onDelete: 'cascade' })
        .primaryKey(),
    playerId: integer('player_id')
        .references(() => statsPlayer.id)
        .notNull(),
    fromTeamName: varchar('from_team_name', { length: 255 }).notNull(),
    fromSubroleName: varchar('from_subrole_name', { length: 255 }),
    toTeamName: varchar('to_team_name', { length: 255 }).notNull(),
    toSubroleName: varchar('to_subrole_name', { length: 255 }),
});

export const statsRevival = pgTable('stats_revival', {
    eventId: integer('event_id')
        .references(() => statsRoundEvent.id, { onDelete: 'cascade' })
        .primaryKey(),
    playerId: integer('player_id')
        .references(() => statsPlayer.id)
        .notNull(),
    teamName: varchar('team_name', { length: 255 }).notNull(),
    subroleName: varchar('subrole_name', { length: 255 }),
});

export const statsWeaponStat = pgTable(
    'stats_weapon_stat',
    {
        id: serial('id').primaryKey(),
        roundPlayerId: integer('round_player_id')
            .references(() => statsRoundPlayer.id, { onDelete: 'cascade' })
            .notNull(),
        weaponName: varchar('weapon_name', { length: 255 }).notNull(),
        kills: integer('kills').notNull().default(0),
        shotsFired: integer('shots_fired'),
        shotsHit: integer('shots_hit'),
        damageDealt: real('damage_dealt'),
    },
    (table) => [uniqueIndex('stats_weapon_stat_unique').on(table.roundPlayerId, table.weaponName)],
);

export const statsMapRelations = relations(statsMap, ({ many }) => ({ sessions: many(statsSession) }));
export const statsSessionRelations = relations(statsSession, ({ one, many }) => ({
    map: one(statsMap, { fields: [statsSession.mapId], references: [statsMap.id] }),
    rounds: many(statsRound),
}));
export const statsRoundRelations = relations(statsRound, ({ one, many }) => ({
    session: one(statsSession, { fields: [statsRound.sessionId], references: [statsSession.id] }),
    players: many(statsRoundPlayer),
    events: many(statsRoundEvent),
}));
export const statsPlayerRelations = relations(statsPlayer, ({ many }) => ({
    rounds: many(statsRoundPlayer),
    victimDeaths: many(statsDeath, { relationName: 'death_victim' }),
    attackerDeaths: many(statsDeath, { relationName: 'death_attacker' }),
    roleChanges: many(statsRoleChange),
    revivals: many(statsRevival),
}));
export const statsRoundPlayerRelations = relations(statsRoundPlayer, ({ one, many }) => ({
    round: one(statsRound, { fields: [statsRoundPlayer.roundId], references: [statsRound.id] }),
    player: one(statsPlayer, { fields: [statsRoundPlayer.playerId], references: [statsPlayer.id] }),
    weapons: many(statsWeaponStat),
}));
export const statsRoundEventRelations = relations(statsRoundEvent, ({ one }) => ({
    round: one(statsRound, { fields: [statsRoundEvent.roundId], references: [statsRound.id] }),
    death: one(statsDeath),
    roleChange: one(statsRoleChange),
    revival: one(statsRevival),
}));
export const statsDeathRelations = relations(statsDeath, ({ one }) => ({
    event: one(statsRoundEvent, { fields: [statsDeath.eventId], references: [statsRoundEvent.id] }),
    victim: one(statsPlayer, {
        fields: [statsDeath.victimPlayerId],
        references: [statsPlayer.id],
        relationName: 'death_victim',
    }),
    attacker: one(statsPlayer, {
        fields: [statsDeath.attackerPlayerId],
        references: [statsPlayer.id],
        relationName: 'death_attacker',
    }),
}));
export const statsRoleChangeRelations = relations(statsRoleChange, ({ one }) => ({
    event: one(statsRoundEvent, { fields: [statsRoleChange.eventId], references: [statsRoundEvent.id] }),
    player: one(statsPlayer, { fields: [statsRoleChange.playerId], references: [statsPlayer.id] }),
}));
export const statsRevivalRelations = relations(statsRevival, ({ one }) => ({
    event: one(statsRoundEvent, { fields: [statsRevival.eventId], references: [statsRoundEvent.id] }),
    player: one(statsPlayer, { fields: [statsRevival.playerId], references: [statsPlayer.id] }),
}));
export const statsWeaponStatRelations = relations(statsWeaponStat, ({ one }) => ({
    roundPlayer: one(statsRoundPlayer, {
        fields: [statsWeaponStat.roundPlayerId],
        references: [statsRoundPlayer.id],
    }),
}));

export type StatsMapType = InferSelectModel<typeof statsMap>;
export type NewStatsMapType = InferInsertModel<typeof statsMap>;
export type StatsSessionType = InferSelectModel<typeof statsSession>;
export type NewStatsSessionType = InferInsertModel<typeof statsSession>;
export type StatsRoundType = InferSelectModel<typeof statsRound>;
export type NewStatsRoundType = InferInsertModel<typeof statsRound>;
export type StatsPlayerType = InferSelectModel<typeof statsPlayer>;
export type NewStatsPlayerType = InferInsertModel<typeof statsPlayer>;
export type StatsRoundPlayerType = InferSelectModel<typeof statsRoundPlayer>;
export type NewStatsRoundPlayerType = InferInsertModel<typeof statsRoundPlayer>;
export type StatsRoundEventType = InferSelectModel<typeof statsRoundEvent>;
export type NewStatsRoundEventType = InferInsertModel<typeof statsRoundEvent>;
export type StatsDeathType = InferSelectModel<typeof statsDeath>;
export type NewStatsDeathType = InferInsertModel<typeof statsDeath>;
export type StatsRoleChangeType = InferSelectModel<typeof statsRoleChange>;
export type NewStatsRoleChangeType = InferInsertModel<typeof statsRoleChange>;
export type StatsRevivalType = InferSelectModel<typeof statsRevival>;
export type NewStatsRevivalType = InferInsertModel<typeof statsRevival>;
export type StatsWeaponStatType = InferSelectModel<typeof statsWeaponStat>;
export type NewStatsWeaponStatType = InferInsertModel<typeof statsWeaponStat>;

export const StatsMapSelectSchema = createSelectSchema(statsMap);
export const StatsMapInsertSchema = createInsertSchema(statsMap);
export const StatsSessionSelectSchema = createSelectSchema(statsSession);
export const StatsSessionInsertSchema = createInsertSchema(statsSession);
export const StatsRoundSelectSchema = createSelectSchema(statsRound);
export const StatsRoundInsertSchema = createInsertSchema(statsRound);
export const StatsPlayerSelectSchema = createSelectSchema(statsPlayer);
export const StatsPlayerInsertSchema = createInsertSchema(statsPlayer);
export const StatsRoundPlayerSelectSchema = createSelectSchema(statsRoundPlayer);
export const StatsRoundPlayerInsertSchema = createInsertSchema(statsRoundPlayer);
export const StatsRoundEventSelectSchema = createSelectSchema(statsRoundEvent);
export const StatsRoundEventInsertSchema = createInsertSchema(statsRoundEvent);
export const StatsDeathSelectSchema = createSelectSchema(statsDeath);
export const StatsDeathInsertSchema = createInsertSchema(statsDeath);
export const StatsRoleChangeSelectSchema = createSelectSchema(statsRoleChange);
export const StatsRoleChangeInsertSchema = createInsertSchema(statsRoleChange);
export const StatsRevivalSelectSchema = createSelectSchema(statsRevival);
export const StatsRevivalInsertSchema = createInsertSchema(statsRevival);
export const StatsWeaponStatSelectSchema = createSelectSchema(statsWeaponStat);
export const StatsWeaponStatInsertSchema = createInsertSchema(statsWeaponStat);
