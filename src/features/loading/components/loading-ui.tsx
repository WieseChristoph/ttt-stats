import Image from 'next/image';
import type { ReactNode } from 'react';
import type { TeamPresentationType } from '@/shared/team';
import { cn, initials } from '@/shared/utils/ui';

type LoadingMetricPropsType = {
    icon: ReactNode;
    label: string;
    value: string;
    valueClassName?: string;
};

export const panelClassName =
    'relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121722]/95 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.22)] xl:p-5';

export function PanelHeader({ icon, title, badge }: { icon: ReactNode; title: string; badge?: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-extrabold text-[13px] text-violet-400 uppercase tracking-[0.12em] [&_svg]:size-4">
                {icon}
                {title}
            </div>
            {badge && (
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-1 font-bold text-[10px] text-violet-300 uppercase tracking-[0.12em]">
                    {badge}
                </span>
            )}
        </div>
    );
}

export function LoadingMetric({ icon, label, value, valueClassName }: LoadingMetricPropsType) {
    return (
        <div className="min-w-0 rounded-xl border border-white/6 bg-white/[0.035] px-3 py-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest [&_svg]:size-3.5 [&_svg]:text-violet-400">
                {icon}
                <span className="truncate">{label}</span>
            </div>
            <strong
                className={cn(
                    'block truncate font-black text-2xl text-slate-100 tabular-nums tracking-[-0.045em]',
                    valueClassName,
                )}
            >
                {value}
            </strong>
        </div>
    );
}

export function PlayerAvatar({ avatarUrl, name }: { avatarUrl: string | null | undefined; name: string }) {
    return avatarUrl ? (
        <Image
            className="size-16 shrink-0 rounded-2xl border border-white/10 object-cover shadow-xl xl:size-20"
            src={avatarUrl}
            alt={name}
            width={80}
            height={80}
        />
    ) : (
        <span
            className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 font-black text-2xl text-violet-300 xl:size-20"
            role="img"
            aria-label={name}
        >
            {initials(name)}
        </span>
    );
}

export function TeamPill({ team }: { team: TeamPresentationType }) {
    return (
        <span
            className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-extrabold text-[11px]"
            style={{ color: team.color, backgroundColor: team.softColor }}
        >
            <span
                className="size-1.75 rounded-full"
                style={{ backgroundColor: team.color }}
            />
            {team.label}
        </span>
    );
}
