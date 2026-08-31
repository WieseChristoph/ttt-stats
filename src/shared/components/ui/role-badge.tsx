import { getRolePresentation } from '@/shared/team';

type RoleBadgePropsType = {
    roleName: string | null | undefined;
    teamName?: string | null;
};

export function RoleBadge({ roleName, teamName }: RoleBadgePropsType) {
    const role = getRolePresentation(roleName, teamName);

    return (
        <span
            className="inline-flex w-fit items-center gap-1.75 whitespace-nowrap rounded-full px-2.25 py-1.5 font-bold text-[11px]"
            style={{ color: role.color, backgroundColor: role.softColor }}
        >
            <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: role.color }}
            />
            {role.label}
        </span>
    );
}
