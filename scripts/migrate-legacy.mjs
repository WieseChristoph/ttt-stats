import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { Pool } from 'pg';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index];
    if (key === '--') {
        index -= 1;
        continue;
    }
    const value = process.argv[index + 1];
    if (key?.startsWith('--') && value) {
        args.set(key.slice(2), value);
    }
}

const dumpPath = args.get('dump');
const legacyTimezone = args.get('legacy-timezone') ?? process.env.LEGACY_TIMEZONE ?? 'Europe/Berlin';
const targetUrl =
    args.get('target') ??
    process.env.DATABASE_URL ??
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

if (!dumpPath || !targetUrl) {
    console.error('Usage: pnpm migrate:legacy -- --dump ../dump_2026-08-29_00_00_01.sql --target <postgres-url>');
    process.exit(1);
}

const TeamAliases = new Map([
    ['1', 'innocents'],
    ['2', 'traitors'],
    ['innocent', 'innocents'],
    ['traitor', 'traitors'],
    ['jackal', 'jackals'],
    ['lover', 'lovers'],
    ['infected', 'infecteds'],
    ['jester', 'jesters'],
    ['dunce', 'dunces'],
    ['none', 'nones'],
    ['neutral', 'nones'],
]);

const normalizeTeamName = (value) => {
    const teamName = String(value).trim().toLowerCase();
    return TeamAliases.get(teamName) ?? teamName;
};

const parseMariaValue = (source, start) => {
    if (source[start] === "'") {
        let value = '';
        let cursor = start + 1;
        while (cursor < source.length) {
            const character = source[cursor];
            if (character === "'") {
                if (source[cursor + 1] === "'") {
                    value += "'";
                    cursor += 2;
                    continue;
                }
                return { value, next: cursor + 1 };
            }
            if (character === '\\') {
                const escaped = source[cursor + 1];
                const escapedValues = { 0: '\0', b: '\b', n: '\n', r: '\r', t: '\t', Z: '\x1a' };
                value += escapedValues[escaped] ?? escaped ?? '';
                cursor += 2;
                continue;
            }
            value += character;
            cursor += 1;
        }
        throw new Error(`Unterminated MariaDB string near character ${start}`);
    }

    let cursor = start;
    while (cursor < source.length && !',);'.includes(source[cursor])) {
        cursor += 1;
    }
    const token = source.slice(start, cursor).trim();
    if (token.toUpperCase() === 'NULL') {
        return { value: null, next: cursor };
    }
    if (/^-?\d+(\.\d+)?$/.test(token)) {
        return { value: Number(token), next: cursor };
    }
    return { value: token, next: cursor };
};

const parseMariaRows = (source, start, tableName) => {
    const rows = [];
    let cursor = start;
    while (cursor < source.length) {
        while (/\s/.test(source[cursor] ?? '')) {
            cursor += 1;
        }
        if (source[cursor] === ';') {
            return rows;
        }
        if (source[cursor] === ',') {
            cursor += 1;
            continue;
        }
        if (source[cursor] !== '(') {
            throw new Error(`Expected a row in MariaDB INSERT for ${tableName} near character ${cursor}`);
        }

        cursor += 1;
        const row = [];
        while (cursor < source.length) {
            while (/\s/.test(source[cursor] ?? '')) {
                cursor += 1;
            }
            const parsed = parseMariaValue(source, cursor);
            row.push(parsed.value);
            cursor = parsed.next;
            while (/\s/.test(source[cursor] ?? '')) {
                cursor += 1;
            }
            if (source[cursor] === ',') {
                cursor += 1;
                continue;
            }
            if (source[cursor] === ')') {
                cursor += 1;
                rows.push(row);
                break;
            }
            throw new Error(`Expected a comma or closing parenthesis in ${tableName} near character ${cursor}`);
        }
    }
    throw new Error(`MariaDB INSERT for ${tableName} has no terminating semicolon`);
};

const parseMariaDump = (source) => {
    const rowsByTable = new Map();
    const insertPattern = /INSERT INTO `([^`]+)` VALUES\s*/g;
    let match = insertPattern.exec(source);
    while (match) {
        const tableName = match[1];
        const rows = parseMariaRows(source, insertPattern.lastIndex, tableName);
        const existingRows = rowsByTable.get(tableName);
        if (existingRows) {
            existingRows.push(...rows);
        } else {
            rowsByTable.set(tableName, rows);
        }
        match = insertPattern.exec(source);
    }
    return rowsByTable;
};

const expectTable = (tables, name, columnCount) => {
    const rows = tables.get(name);
    if (!rows) {
        throw new Error(`MariaDB dump is missing the ${name} table`);
    }
    for (const row of rows) {
        if (row.length !== columnCount) {
            throw new Error(`The ${name} table contains a row with ${row.length} values; expected ${columnCount}`);
        }
    }
    return rows;
};

const source = await readFile(dumpPath, 'utf8');
const tables = parseMariaDump(source);
const oldDeaths = expectTable(tables, 'death', 7).map(
    ([deathId, statisticsId, attackerId, , inflictorName, hitgroupId, timeOfDeath]) => ({
        deathId,
        statisticsId,
        attackerId,
        inflictorName,
        hitgroupId,
        timeOfDeath,
    }),
);
const oldMaps = expectTable(tables, 'map', 3).map(([mapId, mapName, mapStartDate]) => ({
    mapId,
    mapName,
    mapStartDate,
}));
const oldRounds = expectTable(tables, 'round', 5).map(
    ([roundId, mapId, roundStartDate, roundEndDate, winnerTeamName]) => ({
        roundId,
        mapId,
        roundStartDate,
        roundEndDate,
        winnerTeamName: normalizeTeamName(winnerTeamName),
    }),
);
const oldStatistics = expectTable(tables, 'statistics', 4).map(([statisticsId, roundId, steamId, teamName]) => ({
    statisticsId,
    roundId,
    steamId,
    teamName: normalizeTeamName(teamName),
}));

const statisticsById = new Map(oldStatistics.map((statistics) => [statistics.statisticsId, statistics]));
const statisticsByRoundAndSteamId = new Map(
    oldStatistics.map((statistics) => [`${statistics.roundId}:${statistics.steamId}`, statistics]),
);
const roundsById = new Map(oldRounds.map((round) => [round.roundId, round]));

if (args.get('dry-run') === 'true') {
    console.info(
        JSON.stringify(
            {
                dump: dumpPath,
                maps: oldMaps.length,
                rounds: oldRounds.length,
                playerRecords: oldStatistics.length,
                deaths: oldDeaths.length,
                legacyTimezone,
                mode: 'dry-run',
            },
            null,
            2,
        ),
    );
    process.exit(0);
}

const target = new Pool({ connectionString: targetUrl });
const client = await target.connect();

try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM stats_round_event WHERE legacy_key LIKE 'legacy-death-%'`);

    const playerIdsBySteamId = new Map();
    const sessionIdsByMapId = new Map();
    const roundIdsByOldRoundId = new Map();
    const roundPlayerIdsByStatisticsId = new Map();
    const roundPlayerIdsByRoundAndSteamId = new Map();
    const deathCountsByRoundPlayerId = new Map();
    const killCountsByRoundPlayerId = new Map();
    const teamKillCountsByRoundPlayerId = new Map();
    const weaponKillsByRoundPlayerAndWeapon = new Map();
    const nextSequenceByOldRoundId = new Map();

    const getOrCreatePlayerId = async (steamId) => {
        if (!steamId) {
            return null;
        }
        const knownPlayerId = playerIdsBySteamId.get(steamId);
        if (knownPlayerId) {
            return knownPlayerId;
        }
        const result = await client.query(
            `INSERT INTO stats_player (steam_id)
             VALUES ($1)
             ON CONFLICT (steam_id) DO UPDATE SET steam_id = EXCLUDED.steam_id
             RETURNING id`,
            [steamId],
        );
        const playerId = result.rows[0].id;
        playerIdsBySteamId.set(steamId, playerId);
        return playerId;
    };

    for (const oldMap of oldMaps) {
        const mapResult = await client.query(
            `INSERT INTO stats_map (name) VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [oldMap.mapName],
        );
        const mapRoundEndDates = oldRounds
            .filter((round) => round.mapId === oldMap.mapId)
            .map((round) => round.roundEndDate)
            .filter(Boolean)
            .sort();
        const sessionEndDate = mapRoundEndDates.at(-1) ?? null;
        const sessionResult = await client.query(
            `INSERT INTO stats_session (map_id, session_key, started_at, ended_at)
             VALUES ($1, $2, $3::timestamp AT TIME ZONE $5, $4::timestamp AT TIME ZONE $5)
             ON CONFLICT (session_key) DO UPDATE SET
               started_at = EXCLUDED.started_at,
               ended_at = EXCLUDED.ended_at
             RETURNING id`,
            [mapResult.rows[0].id, `legacy-map-${oldMap.mapId}`, oldMap.mapStartDate, sessionEndDate, legacyTimezone],
        );
        sessionIdsByMapId.set(oldMap.mapId, sessionResult.rows[0].id);
    }

    for (const oldRound of oldRounds) {
        const sessionId = sessionIdsByMapId.get(oldRound.mapId);
        if (!sessionId) {
            throw new Error(`Round ${oldRound.roundId} references missing map ${oldRound.mapId}`);
        }
        const result = await client.query(
            `INSERT INTO stats_round (session_id, round_key, started_at, ended_at, winning_team, telemetry_version)
             VALUES ($1, $2, $3::timestamp AT TIME ZONE $6, $4::timestamp AT TIME ZONE $6, $5, 0)
             ON CONFLICT (session_id, round_key) DO UPDATE SET
               started_at = EXCLUDED.started_at,
               ended_at = EXCLUDED.ended_at,
               winning_team = EXCLUDED.winning_team,
               telemetry_version = 0
             RETURNING id`,
            [
                sessionId,
                `legacy-round-${oldRound.roundId}`,
                oldRound.roundStartDate,
                oldRound.roundEndDate,
                oldRound.winnerTeamName,
                legacyTimezone,
            ],
        );
        roundIdsByOldRoundId.set(oldRound.roundId, result.rows[0].id);
        nextSequenceByOldRoundId.set(oldRound.roundId, 1);
    }

    for (const statisticsRecord of oldStatistics) {
        const roundId = roundIdsByOldRoundId.get(statisticsRecord.roundId);
        if (!roundId) {
            throw new Error(
                `Statistics ${statisticsRecord.statisticsId} references missing round ${statisticsRecord.roundId}`,
            );
        }
        const playerId = await getOrCreatePlayerId(statisticsRecord.steamId);
        const result = await client.query(
            `INSERT INTO stats_round_player (
                round_id,
                player_id,
                initial_team_name,
                final_team_name
             ) VALUES ($1, $2, $3, $3)
             ON CONFLICT (round_id, player_id) DO UPDATE SET
               initial_team_name = EXCLUDED.initial_team_name,
               final_team_name = EXCLUDED.final_team_name
             RETURNING id`,
            [roundId, playerId, statisticsRecord.teamName],
        );
        const roundPlayerId = result.rows[0].id;
        roundPlayerIdsByStatisticsId.set(statisticsRecord.statisticsId, roundPlayerId);
        roundPlayerIdsByRoundAndSteamId.set(`${statisticsRecord.roundId}:${statisticsRecord.steamId}`, roundPlayerId);
    }

    const orderedDeaths = [...oldDeaths].sort((left, right) => {
        const leftRoundId = statisticsById.get(left.statisticsId)?.roundId ?? 0;
        const rightRoundId = statisticsById.get(right.statisticsId)?.roundId ?? 0;
        if (leftRoundId !== rightRoundId) {
            return leftRoundId - rightRoundId;
        }
        if (left.timeOfDeath && right.timeOfDeath && left.timeOfDeath !== right.timeOfDeath) {
            return left.timeOfDeath.localeCompare(right.timeOfDeath);
        }
        return left.deathId - right.deathId;
    });
    for (const oldDeath of orderedDeaths) {
        const victimStatistics = statisticsById.get(oldDeath.statisticsId);
        const victimPlayerId = victimStatistics ? await getOrCreatePlayerId(victimStatistics.steamId) : null;
        const victimRoundPlayerId = roundPlayerIdsByStatisticsId.get(oldDeath.statisticsId);
        const roundId = victimStatistics ? roundIdsByOldRoundId.get(victimStatistics.roundId) : null;
        const oldRound = victimStatistics ? roundsById.get(victimStatistics.roundId) : null;
        if (!victimStatistics || !victimPlayerId || !victimRoundPlayerId || !roundId || !oldRound) {
            throw new Error(`Death ${oldDeath.deathId} references missing statistics ${oldDeath.statisticsId}`);
        }

        const attackerSteamId = oldDeath.attackerId;
        const attackerPlayerId = await getOrCreatePlayerId(attackerSteamId);
        const attackerStatistics = attackerSteamId
            ? statisticsByRoundAndSteamId.get(`${victimStatistics.roundId}:${attackerSteamId}`)
            : undefined;
        const attackerRoundPlayerId = attackerStatistics
            ? roundPlayerIdsByRoundAndSteamId.get(`${attackerStatistics.roundId}:${attackerStatistics.steamId}`)
            : undefined;
        const isTeamkill = Boolean(
            attackerStatistics &&
                attackerSteamId !== victimStatistics.steamId &&
                attackerStatistics.teamName !== 'nones' &&
                attackerStatistics.teamName === victimStatistics.teamName,
        );
        const sequence = nextSequenceByOldRoundId.get(victimStatistics.roundId);
        if (!sequence) {
            throw new Error(`Event sequence for round ${victimStatistics.roundId} could not be resolved`);
        }
        nextSequenceByOldRoundId.set(victimStatistics.roundId, sequence + 1);

        const eventResult = await client.query(
            `INSERT INTO stats_round_event (round_id, sequence, type, occurred_at, legacy_key)
             VALUES ($1, $2, 'death', $3::timestamp AT TIME ZONE $5, $4)
             ON CONFLICT (legacy_key) DO UPDATE SET
               sequence = EXCLUDED.sequence,
               occurred_at = EXCLUDED.occurred_at
             RETURNING id`,
            [roundId, sequence, oldDeath.timeOfDeath, `legacy-death-${oldDeath.deathId}`, legacyTimezone],
        );

        await client.query(
            `INSERT INTO stats_death (
                event_id,
                victim_player_id,
                attacker_player_id,
                victim_team_name,
                attacker_team_name,
                is_teamkill,
                inflictor,
                hitgroup
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (event_id) DO UPDATE SET
               victim_player_id = EXCLUDED.victim_player_id,
               attacker_player_id = EXCLUDED.attacker_player_id,
               victim_team_name = EXCLUDED.victim_team_name,
               attacker_team_name = EXCLUDED.attacker_team_name,
               is_teamkill = EXCLUDED.is_teamkill,
               inflictor = EXCLUDED.inflictor,
               hitgroup = EXCLUDED.hitgroup`,
            [
                eventResult.rows[0].id,
                victimPlayerId,
                attackerPlayerId,
                victimStatistics.teamName,
                attackerStatistics?.teamName ?? null,
                isTeamkill,
                oldDeath.inflictorName,
                oldDeath.hitgroupId,
            ],
        );

        deathCountsByRoundPlayerId.set(
            victimRoundPlayerId,
            (deathCountsByRoundPlayerId.get(victimRoundPlayerId) ?? 0) + 1,
        );
        if (attackerRoundPlayerId && attackerSteamId !== victimStatistics.steamId) {
            killCountsByRoundPlayerId.set(
                attackerRoundPlayerId,
                (killCountsByRoundPlayerId.get(attackerRoundPlayerId) ?? 0) + 1,
            );
            if (isTeamkill) {
                teamKillCountsByRoundPlayerId.set(
                    attackerRoundPlayerId,
                    (teamKillCountsByRoundPlayerId.get(attackerRoundPlayerId) ?? 0) + 1,
                );
            }
            if (oldDeath.inflictorName) {
                const weaponKey = `${attackerRoundPlayerId}:${oldDeath.inflictorName}`;
                weaponKillsByRoundPlayerAndWeapon.set(
                    weaponKey,
                    (weaponKillsByRoundPlayerAndWeapon.get(weaponKey) ?? 0) + 1,
                );
            }
        }
    }

    for (const roundPlayerId of roundPlayerIdsByStatisticsId.values()) {
        await client.query(
            `UPDATE stats_round_player
             SET deaths = $1, kills = $2, team_kills = $3
             WHERE id = $4`,
            [
                deathCountsByRoundPlayerId.get(roundPlayerId) ?? 0,
                killCountsByRoundPlayerId.get(roundPlayerId) ?? 0,
                teamKillCountsByRoundPlayerId.get(roundPlayerId) ?? 0,
                roundPlayerId,
            ],
        );
    }

    for (const [key, kills] of weaponKillsByRoundPlayerAndWeapon) {
        const separatorIndex = key.indexOf(':');
        const roundPlayerId = Number(key.slice(0, separatorIndex));
        const weaponName = key.slice(separatorIndex + 1);
        await client.query(
            `INSERT INTO stats_weapon_stat (round_player_id, weapon_name, kills)
             VALUES ($1, $2, $3)
             ON CONFLICT (round_player_id, weapon_name) DO UPDATE SET kills = EXCLUDED.kills`,
            [roundPlayerId, weaponName, kills],
        );
    }

    await client.query('COMMIT');
    console.info(
        JSON.stringify(
            {
                dump: dumpPath,
                maps: oldMaps.length,
                sessions: sessionIdsByMapId.size,
                rounds: oldRounds.length,
                playerRecords: oldStatistics.length,
                uniquePlayers: playerIdsBySteamId.size,
                events: oldDeaths.length,
                deaths: oldDeaths.length,
                weaponStats: weaponKillsByRoundPlayerAndWeapon.size,
                telemetryVersion: 0,
                legacyTimezone,
            },
            null,
            2,
        ),
    );
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
    await target.end();
}
