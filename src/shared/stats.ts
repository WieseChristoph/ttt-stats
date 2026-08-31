export const AccuracyQualificationShots = 500;

export const HitGroupValues = {
    generic: 0,
    head: 1,
    chest: 2,
    stomach: 3,
    leftArm: 4,
    rightArm: 5,
    leftLeg: 6,
    rightLeg: 7,
    gear: 10,
} satisfies Record<string, number>;
export type HitGroupType = (typeof HitGroupValues)[keyof typeof HitGroupValues];

function ratio(numerator: number, denominator: number): number | null {
    return denominator > 0 ? numerator / denominator : null;
}

export function percentage(numerator: number, denominator: number): number | null {
    const value = ratio(numerator, denominator);
    return value === null ? null : value * 100;
}

export function enemyKills(kills: number, teamKills: number): number {
    return Math.max(0, kills - teamKills);
}

export function formatWeaponLabel(value: string): string {
    return value
        .replace(/^(weapon_|ttt_|zm_|sp_|ap_)+/, '')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}
