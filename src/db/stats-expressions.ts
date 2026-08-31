import { and, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { statsDeath } from '@/db/schema';
import { HitGroupValues } from '@/shared/stats';

export function enemyKillCondition() {
    return and(
        isNotNull(statsDeath.attackerPlayerId),
        ne(statsDeath.attackerPlayerId, statsDeath.victimPlayerId),
        eq(statsDeath.isTeamkill, false),
    );
}

export function teamKillCondition() {
    return eq(statsDeath.isTeamkill, true);
}

export function eligibleHeadshotKillCondition() {
    return and(enemyKillCondition(), isNotNull(statsDeath.hitgroup));
}

export function headshotCondition() {
    return and(enemyKillCondition(), eq(statsDeath.hitgroup, HitGroupValues.head));
}

export function enemyKillCount() {
    return sql<number>`count(*) filter (where ${enemyKillCondition()})`.mapWith(Number);
}

export function teamKillCount() {
    return sql<number>`count(*) filter (where ${teamKillCondition()})`.mapWith(Number);
}

export function eligibleHeadshotKillCount() {
    return sql<number>`count(*) filter (where ${eligibleHeadshotKillCondition()})`.mapWith(Number);
}

export function headshotCount() {
    return sql<number>`count(*) filter (where ${headshotCondition()})`.mapWith(Number);
}
