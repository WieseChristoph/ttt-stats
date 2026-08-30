import { getTeamPresentation } from '@/shared/team';

type TeamBadgePropsType = {
    teamName: string | null | undefined;
};

export function TeamBadge({ teamName }: TeamBadgePropsType) {
    const team = getTeamPresentation(teamName);

    return (
        <span
            className="inline-flex w-fit items-center gap-1.75 whitespace-nowrap rounded-full px-2.25 py-1.5 font-bold text-[11px]"
            style={{ color: team.color, backgroundColor: team.softColor }}
        >
            <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: team.color }}
            />
            {team.label}
        </span>
    );
}
