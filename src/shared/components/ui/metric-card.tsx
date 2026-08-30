import type { ReactNode } from 'react';

type MetricCardPropsType = {
    label: string;
    value: string;
    detail?: string;
    icon: ReactNode;
    tone?: 'green' | 'red' | 'blue' | 'amber';
};

const toneClasses = {
    green: 'text-[var(--green)]',
    red: 'text-[var(--red)]',
    blue: 'text-[var(--purple)]',
    amber: 'text-[var(--amber)]',
} satisfies Record<NonNullable<MetricCardPropsType['tone']>, string>;

export function MetricCard({ label, value, detail, icon, tone = 'blue' }: MetricCardPropsType) {
    return (
        <article className="flex min-h-32 items-start gap-3.5 rounded-[14px] border border-(--line) bg-(--panel) p-5 max-[559px]:min-h-26.25 max-[559px]:p-3.5">
            <div
                className={`grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-[rgba(157,140,255,0.14)] [&_svg]:size-4.75 ${toneClasses[tone]}`}
            >
                {icon}
            </div>
            <div>
                <p className="m-0 mb-2.5 flex items-center gap-1.75 font-bold text-(--purple) text-[11px] uppercase tracking-[0.11em] [&_svg]:size-3.5">
                    {label}
                </p>
                <p className="m-[5px_0_3px] font-extrabold text-[30px] tracking-[-0.06em] max-[559px]:text-[25px]">
                    {value}
                </p>
                {detail && <p className="text-(--muted)">{detail}</p>}
            </div>
        </article>
    );
}
