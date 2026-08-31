import process from 'node:process';
import { Pool } from 'pg';

const RoundsPerSession = 4;
const SessionSpacingMilliseconds = 86_400_000;
const RoundSpacingSeconds = 600;

function parseArguments(argv) {
    const parsed = new Map();
    for (let index = 2; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--reset') {
            parsed.set('reset', true);
        } else if (argument?.startsWith('--')) {
            parsed.set(argument.slice(2), argv[index + 1]);
            index += 1;
        }
    }

    return parsed;
}

const argumentsMap = parseArguments(process.argv);
const roundsToCreate = Math.max(1, Number(argumentsMap.get('rounds') ?? 48));
const shouldReset = argumentsMap.get('reset') === true;
const targetUrl =
    process.env.DATABASE_URL ??
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const maps = ['ttt_dummy_station', 'ttt_dummy_mansion', 'ttt_dummy_lab', 'ttt_dummy_rooftops'];
const teams = ['innocents', 'traitors', 'jackals', 'jesters', 'infecteds', 'lovers', 'dunces', 'nones'];
const weapons = ['weapon_ttt_m16', 'weapon_zm_shotgun', 'weapon_ttt_mp5', 'weapon_ttt_pistol', 'weapon_ttt_g3sg1'];
const players = Array.from({ length: 12 }, (_, index) => ({
    steamId: `765611980000000${String(index + 1).padStart(2, '0')}`,
    team: [
        'innocents',
        'traitors',
        'traitors',
        'innocents',
        'jackals',
        'jesters',
        'infecteds',
        'lovers',
        'dunces',
        'nones',
        'innocents',
        'traitors',
    ][index],
    role: [
        'innocent',
        'traitor',
        'traitor',
        'detective',
        'jackal',
        'jester',
        'infected',
        'lover',
        'dunce',
        'none',
        'detective',
        'traitor',
    ][index],
}));

const random = (seed) => {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
};

const addSeconds = (date, seconds) => new Date(date.getTime() + seconds * 1000);
const iso = (date) => date.toISOString();

function getRoundSchedule(index, totalRounds, runStartedAt, runKey) {
    const sessionIndex = Math.floor(index / RoundsPerSession);
    const roundIndexInSession = index % RoundsPerSession;
    const totalSessions = Math.ceil(totalRounds / RoundsPerSession);
    const sessionStartedAt = new Date(
        runStartedAt.getTime() - (totalSessions - sessionIndex) * SessionSpacingMilliseconds,
    );

    return {
        mapName: maps[sessionIndex % maps.length],
        sessionKey: `${runKey}-session-${sessionIndex + 1}`,
        sessionStartedAt,
        startedAt: addSeconds(sessionStartedAt, roundIndexInSession * RoundSpacingSeconds),
    };
}

async function query(client, text, values = []) {
    return (await client.query(text, values)).rows;
}

async function getOrCreateMap(client, name) {
    const rows = await query(
        client,
        `insert into stats_map (name) values ($1)
         on conflict (name) do update set name = excluded.name
         returning id`,
        [name],
    );
    return rows[0].id;
}

async function getOrCreatePlayer(client, steamId) {
    const rows = await query(
        client,
        `insert into stats_player (steam_id) values ($1)
         on conflict (steam_id) do update set steam_id = excluded.steam_id
         returning id`,
        [steamId],
    );
    return rows[0].id;
}

async function main() {
    if (!targetUrl || targetUrl.includes('undefined')) {
        throw new Error('Database environment is incomplete. Copy .env.example to .env first.');
    }

    const pool = new Pool({ connectionString: targetUrl });
    const client = await pool.connect();
    const runStartedAt = new Date();
    const runKey = `dummy-${runStartedAt.getTime()}`;

    try {
        await client.query('begin');
        if (shouldReset) {
            await client.query(`delete from stats_session where session_key like 'dummy-%'`);
            await client.query(
                `delete from stats_player p
                 where p.steam_id like '765611980000000%'
                   and not exists (select 1 from stats_round_player rp where rp.player_id = p.id)`,
            );
        }

        const mapIds = new Map();
        for (const map of maps) {
            mapIds.set(map, await getOrCreateMap(client, map));
        }
        const playerIds = new Map();
        for (const player of players) {
            playerIds.set(player.steamId, await getOrCreatePlayer(client, player.steamId));
        }

        const sessionIds = new Map();
        for (let index = 0; index < roundsToCreate; index += 1) {
            const { mapName, sessionKey, sessionStartedAt, startedAt } = getRoundSchedule(
                index,
                roundsToCreate,
                runStartedAt,
                runKey,
            );
            let sessionId = sessionIds.get(sessionKey);
            if (!sessionId) {
                const sessionRows = await query(
                    client,
                    `insert into stats_session (map_id, session_key, started_at)
                     values ($1, $2, $3) returning id`,
                    [mapIds.get(mapName), sessionKey, iso(sessionStartedAt)],
                );
                sessionId = sessionRows[0].id;
                sessionIds.set(sessionKey, sessionId);
            }
            const duration = 150 + Math.floor(random(index + 4) * 300);
            const endedAt = addSeconds(startedAt, duration);
            const eventOffsetScale = Math.min(1, (duration - 10) / 195);
            const eventAt = (preferredOffset) => addSeconds(startedAt, Math.round(preferredOffset * eventOffsetScale));
            const winner = teams[index % 4];
            const roundRows = await query(
                client,
                `insert into stats_round (session_id, round_key, started_at, ended_at, winning_team, winning_subrole, telemetry_version)
                 values ($1, $2, $3, $4, $5, $6, 1) returning id`,
                [
                    sessionId,
                    `${runKey}-round-${index + 1}`,
                    iso(startedAt),
                    iso(endedAt),
                    winner,
                    winner === 'innocents' ? 'detective' : null,
                ],
            );
            const roundId = roundRows[0].id;
            const roster = players.filter((_, playerIndex) => (playerIndex + index) % 3 !== 0).slice(0, 9);
            const finalTeams = new Map(roster.map((player) => [player.steamId, player.team]));
            const converted = roster[index % roster.length];
            if (index % 3 === 0 && converted) {
                finalTeams.set(converted.steamId, 'traitors');
            }

            const events = [];
            const deathCandidates = roster.slice(0, Math.min(6, roster.length));
            for (let deathIndex = 0; deathIndex < deathCandidates.length; deathIndex += 1) {
                const victim = deathCandidates[deathIndex];
                const sameTeam = deathIndex === 2;
                let attacker = null;
                if (deathIndex !== 5) {
                    attacker =
                        roster.find(
                            (candidate) =>
                                candidate.steamId !== victim.steamId &&
                                (sameTeam
                                    ? finalTeams.get(candidate.steamId) === finalTeams.get(victim.steamId)
                                    : finalTeams.get(candidate.steamId) !== finalTeams.get(victim.steamId)),
                        ) ?? null;
                }
                events.push({
                    type: 'death',
                    occurredAt: eventAt(20 + deathIndex * 35),
                    victim,
                    attacker,
                    inflictor: attacker ? weapons[(deathIndex + index) % weapons.length] : 'worldspawn',
                    hitgroup: attacker && deathIndex % 2 === 0 ? 1 : 2,
                });
            }
            if (converted && index % 3 === 0) {
                events.push({
                    type: 'role_change',
                    occurredAt: eventAt(70),
                    player: converted,
                    fromTeam: converted.team,
                    fromRole: converted.role,
                    toTeam: 'traitors',
                    toRole: 'traitor',
                });
            }
            if (index % 4 === 0 && deathCandidates[0]) {
                events.push({
                    type: 'revival',
                    occurredAt: eventAt(115),
                    player: deathCandidates[0],
                    team: finalTeams.get(deathCandidates[0].steamId),
                    role: deathCandidates[0].role,
                });
            }
            events.sort((left, right) => left.occurredAt - right.occurredAt);

            const aggregates = new Map(roster.map((player) => [player.steamId, { kills: 0, deaths: 0, teamKills: 0 }]));
            for (const event of events) {
                if (event.type !== 'death') {
                    continue;
                }
                aggregates.get(event.victim.steamId).deaths += 1;
                if (event.attacker) {
                    aggregates.get(event.attacker.steamId).kills += 1;
                    if (
                        finalTeams.get(event.attacker.steamId) === finalTeams.get(event.victim.steamId) &&
                        finalTeams.get(event.attacker.steamId) !== 'nones'
                    ) {
                        aggregates.get(event.attacker.steamId).teamKills += 1;
                    }
                }
            }

            const roundPlayerIds = new Map();
            for (const [playerIndex, player] of roster.entries()) {
                const aggregate = aggregates.get(player.steamId);
                const shotsFired = 120 + Math.floor(random(index * 17 + playerIndex) * 260);
                const shotsHit = Math.floor(shotsFired * (0.22 + random(index + playerIndex) * 0.38));
                const finalTeam = finalTeams.get(player.steamId);
                const row = await query(
                    client,
                    `insert into stats_round_player (round_id, player_id, initial_team_name, initial_subrole_name, final_team_name, final_subrole_name, joined_at, left_at, kills, deaths, team_kills, damage_dealt, damage_taken, shots_fired, shots_hit, survival_seconds)
                     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) returning id`,
                    [
                        roundId,
                        playerIds.get(player.steamId),
                        player.team,
                        player.role,
                        finalTeam,
                        finalTeam === 'traitors' ? 'traitor' : player.role,
                        iso(startedAt),
                        iso(endedAt),
                        aggregate.kills,
                        aggregate.deaths,
                        aggregate.teamKills,
                        120 + shotsHit * 3,
                        80 + shotsFired * 0.8,
                        shotsFired,
                        shotsHit,
                        Math.max(15, duration - aggregate.deaths * 35),
                    ],
                );
                roundPlayerIds.set(player.steamId, row[0].id);
                for (let weaponIndex = 0; weaponIndex < 2; weaponIndex += 1) {
                    const weapon = weapons[(playerIndex + weaponIndex + index) % weapons.length];
                    const weaponShots = Math.floor(shotsFired * (weaponIndex === 0 ? 0.55 : 0.3));
                    const weaponHits = Math.floor(
                        weaponShots * (0.2 + random(index + playerIndex + weaponIndex) * 0.4),
                    );
                    const weaponKills = events.filter(
                        (event) =>
                            event.type === 'death' &&
                            event.attacker?.steamId === player.steamId &&
                            event.inflictor === weapon,
                    ).length;
                    await client.query(
                        `insert into stats_weapon_stat (round_player_id, weapon_name, kills, shots_fired, shots_hit, damage_dealt)
                         values ($1, $2, $3, $4, $5, $6)`,
                        [
                            roundPlayerIds.get(player.steamId),
                            weapon,
                            weaponKills,
                            weaponShots,
                            weaponHits,
                            weaponHits * 18,
                        ],
                    );
                }
            }

            let sequence = 1;
            for (const event of events) {
                const eventRows = await query(
                    client,
                    `insert into stats_round_event (round_id, sequence, type, occurred_at)
                     values ($1, $2, $3, $4) returning id`,
                    [roundId, sequence, event.type, iso(event.occurredAt)],
                );
                const eventId = eventRows[0].id;
                if (event.type === 'death') {
                    await client.query(
                        `insert into stats_death (event_id, victim_player_id, attacker_player_id, victim_team_name, victim_subrole_name, attacker_team_name, attacker_subrole_name, is_teamkill, inflictor, hitgroup)
                         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            eventId,
                            playerIds.get(event.victim.steamId),
                            event.attacker ? playerIds.get(event.attacker.steamId) : null,
                            finalTeams.get(event.victim.steamId),
                            event.victim.role,
                            event.attacker ? finalTeams.get(event.attacker.steamId) : null,
                            event.attacker?.role ?? null,
                            Boolean(
                                event.attacker &&
                                    finalTeams.get(event.attacker.steamId) === finalTeams.get(event.victim.steamId) &&
                                    finalTeams.get(event.attacker.steamId) !== 'nones',
                            ),
                            event.inflictor,
                            event.hitgroup,
                        ],
                    );
                } else if (event.type === 'role_change') {
                    await client.query(
                        `insert into stats_role_change (event_id, player_id, from_team_name, from_subrole_name, to_team_name, to_subrole_name)
                         values ($1, $2, $3, $4, $5, $6)`,
                        [
                            eventId,
                            playerIds.get(event.player.steamId),
                            event.fromTeam,
                            event.fromRole,
                            event.toTeam,
                            event.toRole,
                        ],
                    );
                } else {
                    await client.query(
                        `insert into stats_revival (event_id, player_id, team_name, subrole_name)
                         values ($1, $2, $3, $4)`,
                        [eventId, playerIds.get(event.player.steamId), event.team, event.role],
                    );
                }
                sequence += 1;
            }
        }

        await client.query(
            `update stats_session s set ended_at = latest.ended_at
             from (select session_id, max(ended_at) ended_at from stats_round where session_id = any($1) group by session_id) latest
             where s.id = latest.session_id`,
            [[...sessionIds.values()]],
        );
        await client.query('commit');
        console.info(
            `Seeded ${roundsToCreate} dummy rounds across ${sessionIds.size} sessions and ${maps.length} maps (${runKey}).`,
        );
        console.info('Run with --reset to remove all dummy-prefixed sessions and their data.');
    } catch (error) {
        await client.query('rollback');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
