import { labelize } from './utils/format';

export const TeamValues = {
    innocents: 'innocents',
    traitors: 'traitors',
    jackals: 'jackals',
    lovers: 'lovers',
    infecteds: 'infecteds',
    jesters: 'jesters',
    dunces: 'dunces',
    nones: 'nones',
} satisfies Record<string, string>;

export type TeamType = (typeof TeamValues)[keyof typeof TeamValues];

export type TeamPresentationType = {
    label: string;
    color: string;
    softColor: string;
};

const TeamPresentation: Record<TeamType, TeamPresentationType> = {
    [TeamValues.innocents]: {
        label: 'Innocents',
        color: '#63d471',
        softColor: 'rgba(99, 212, 113, .16)',
    },
    [TeamValues.traitors]: {
        label: 'Traitors',
        color: '#ff6675',
        softColor: 'rgba(255, 102, 117, .16)',
    },
    [TeamValues.jackals]: {
        label: 'Jackals',
        color: '#5ed6e8',
        softColor: 'rgba(94, 214, 232, .16)',
    },
    [TeamValues.lovers]: {
        label: 'Lovers',
        color: '#ff71c8',
        softColor: 'rgba(255, 113, 200, .16)',
    },
    [TeamValues.infecteds]: {
        label: 'Infecteds',
        color: '#bd7894',
        softColor: 'rgba(189, 120, 148, .16)',
    },
    [TeamValues.jesters]: {
        label: 'Jesters',
        color: '#f1a1e1',
        softColor: 'rgba(241, 161, 225, .16)',
    },
    [TeamValues.dunces]: {
        label: 'Dunces',
        color: '#b4a594',
        softColor: 'rgba(180, 165, 148, .16)',
    },
    [TeamValues.nones]: {
        label: 'Neutral',
        color: '#9d8cff',
        softColor: 'rgba(157, 140, 255, .16)',
    },
};

const UnknownTeamPresentation: TeamPresentationType = {
    label: 'Unknown',
    color: '#9aa4b2',
    softColor: 'rgba(154, 164, 178, .16)',
};

const RolePresentation: Record<string, TeamPresentationType> = {
    innocent: TeamPresentation[TeamValues.innocents],
    detective: {
        label: 'Detective',
        color: '#62a8ff',
        softColor: 'rgba(98, 168, 255, .16)',
    },
    traitor: TeamPresentation[TeamValues.traitors],
    jackal: TeamPresentation[TeamValues.jackals],
    sidekick: TeamPresentation[TeamValues.jackals],
    lover: TeamPresentation[TeamValues.lovers],
    infected: TeamPresentation[TeamValues.infecteds],
    jester: TeamPresentation[TeamValues.jesters],
    dunce: TeamPresentation[TeamValues.dunces],
};

const TeamAliases: Readonly<Record<string, TeamType>> = {
    '1': TeamValues.innocents,
    '2': TeamValues.traitors,
    innocent: TeamValues.innocents,
    innocents: TeamValues.innocents,
    traitor: TeamValues.traitors,
    traitors: TeamValues.traitors,
    jackal: TeamValues.jackals,
    jackals: TeamValues.jackals,
    lover: TeamValues.lovers,
    lovers: TeamValues.lovers,
    infected: TeamValues.infecteds,
    infecteds: TeamValues.infecteds,
    jester: TeamValues.jesters,
    jesters: TeamValues.jesters,
    dunce: TeamValues.dunces,
    dunces: TeamValues.dunces,
    none: TeamValues.nones,
    nones: TeamValues.nones,
    neutral: TeamValues.nones,
};

function isTeamType(value: string): value is TeamType {
    return Object.hasOwn(TeamPresentation, value);
}

export function normalizeTeamName(teamName: string): string {
    const trimmedTeamName = teamName.trim();

    return TeamAliases[trimmedTeamName.toLocaleLowerCase()] ?? trimmedTeamName;
}

export function getTeamPresentation(teamName: string | null | undefined): TeamPresentationType {
    if (teamName) {
        const normalizedTeamName = normalizeTeamName(teamName);
        if (isTeamType(normalizedTeamName)) {
            return TeamPresentation[normalizedTeamName];
        }

        return { ...UnknownTeamPresentation, label: labelize(normalizedTeamName) };
    }

    return UnknownTeamPresentation;
}

export function getRolePresentation(
    subroleName: string | null | undefined,
    teamName: string | null | undefined,
): TeamPresentationType {
    if (subroleName) {
        const role = RolePresentation[subroleName.toLocaleLowerCase()];
        if (role) {
            return role;
        }
    }

    return getTeamPresentation(teamName);
}
