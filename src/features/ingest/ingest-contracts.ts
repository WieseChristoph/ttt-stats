import { z } from 'zod';
import { type HitGroupType, HitGroupValues } from '@/shared/stats';
import { normalizeTeamName } from '@/shared/team';

export { type HitGroupType, HitGroupValues };

const SteamIdSchema = z.string().regex(/^\d{17}$/, 'Steam ID must contain 17 digits');

const NullableDateSchema = z.iso
    .datetime()
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const TeamNameSchema = z.string().trim().min(1).max(255).transform(normalizeTeamName);

const SubroleNameSchema = z
    .string()
    .trim()
    .min(1)
    .max(255)
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const IngestEventPlayerSnapshotSchema = z.object({
    steamId: SteamIdSchema,
    teamName: TeamNameSchema,
    subroleName: SubroleNameSchema,
});
export type IngestEventPlayerSnapshotType = z.infer<typeof IngestEventPlayerSnapshotSchema>;

const IngestEventBaseSchema = z.object({
    sequence: z.number().int().positive(),
    occurredAt: z.iso.datetime(),
});

export const IngestDeathEventSchema = IngestEventBaseSchema.extend({
    type: z.literal('death'),
    victim: IngestEventPlayerSnapshotSchema,
    attacker: IngestEventPlayerSnapshotSchema.nullable()
        .optional()
        .transform((value) => value ?? null),
    inflictor: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .nullable()
        .optional()
        .transform((value) => value ?? null),
    hitgroup: z
        .number()
        .int()
        .nullable()
        .optional()
        .transform((value) => value ?? null),
});
export type IngestDeathEventType = z.infer<typeof IngestDeathEventSchema>;

export const IngestRoleChangeEventSchema = IngestEventBaseSchema.extend({
    type: z.literal('roleChange'),
    steamId: SteamIdSchema,
    fromTeamName: TeamNameSchema,
    fromSubroleName: SubroleNameSchema,
    toTeamName: TeamNameSchema,
    toSubroleName: SubroleNameSchema,
});
export type IngestRoleChangeEventType = z.infer<typeof IngestRoleChangeEventSchema>;

export const IngestRevivalEventSchema = IngestEventBaseSchema.extend({
    type: z.literal('revival'),
    steamId: SteamIdSchema,
    teamName: TeamNameSchema,
    subroleName: SubroleNameSchema,
});
export type IngestRevivalEventType = z.infer<typeof IngestRevivalEventSchema>;

export const IngestRoundEventSchema = z.discriminatedUnion('type', [
    IngestDeathEventSchema,
    IngestRoleChangeEventSchema,
    IngestRevivalEventSchema,
]);
export type IngestRoundEventType = z.infer<typeof IngestRoundEventSchema>;

export const IngestWeaponStatSchema = z.object({
    weaponName: z.string().trim().min(1).max(255),
    shotsFired: z.number().int().nonnegative(),
    shotsHit: z.number().int().nonnegative(),
    damageDealt: z.number().nonnegative(),
});
export type IngestWeaponStatType = z.infer<typeof IngestWeaponStatSchema>;

export const IngestRoundPlayerSchema = z.object({
    steamId: SteamIdSchema,
    initialTeamName: TeamNameSchema,
    initialSubroleName: SubroleNameSchema,
    finalTeamName: TeamNameSchema,
    finalSubroleName: SubroleNameSchema,
    joinedAt: NullableDateSchema,
    leftAt: NullableDateSchema,
    damageDealt: z.number().nonnegative(),
    damageTaken: z.number().nonnegative(),
    shotsFired: z.number().int().nonnegative(),
    shotsHit: z.number().int().nonnegative(),
    survivalSeconds: z.number().nonnegative(),
    weapons: z.array(IngestWeaponStatSchema),
});
export type IngestRoundPlayerType = z.infer<typeof IngestRoundPlayerSchema>;

export const IngestSessionSchema = z.object({
    protocolVersion: z.literal(1),
    sessionKey: z.string().min(1).max(255),
    mapName: z.string().min(1).max(255),
    startedAt: z.iso.datetime(),
});
export type IngestSessionType = z.infer<typeof IngestSessionSchema>;

export const IngestRoundSchema = z
    .object({
        protocolVersion: z.literal(1),
        sessionKey: z.string().min(1).max(255),
        sessionStartedAt: z.iso.datetime(),
        roundKey: z.string().min(1).max(255),
        mapName: z.string().min(1).max(255),
        startedAt: z.iso.datetime(),
        endedAt: z.iso.datetime(),
        winningTeam: TeamNameSchema,
        winningSubrole: SubroleNameSchema,
        players: z.array(IngestRoundPlayerSchema),
        events: z.array(IngestRoundEventSchema),
    })
    .superRefine((round, context) => {
        const playerSteamIds = new Set<string>();
        for (const player of round.players) {
            if (playerSteamIds.has(player.steamId)) {
                context.addIssue({
                    code: 'custom',
                    message: `Player ${player.steamId} occurs more than once`,
                    path: ['players'],
                });
            }
            playerSteamIds.add(player.steamId);
        }

        const sequences = new Set<number>();
        for (const [index, event] of round.events.entries()) {
            if (sequences.has(event.sequence)) {
                context.addIssue({
                    code: 'custom',
                    message: `Event sequence ${event.sequence} occurs more than once`,
                    path: ['events', index, 'sequence'],
                });
            }
            sequences.add(event.sequence);

            const referencedSteamIds =
                event.type === 'death'
                    ? [event.victim.steamId, ...(event.attacker ? [event.attacker.steamId] : [])]
                    : [event.steamId];
            for (const steamId of referencedSteamIds) {
                if (!playerSteamIds.has(steamId)) {
                    context.addIssue({
                        code: 'custom',
                        message: `Event references player ${steamId}, who is not in the round`,
                        path: ['events', index],
                    });
                }
            }
        }
    });
export type IngestRoundType = z.infer<typeof IngestRoundSchema>;
