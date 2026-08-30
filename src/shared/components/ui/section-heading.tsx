import type { ReactNode } from 'react';

type SectionHeadingPropsType = { title: string; action?: ReactNode };

export function SectionHeading({ title, action }: SectionHeadingPropsType) {
    return (
        <div className="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 className="m-0 text-[22px] tracking-[-0.04em]">{title}</h2>
            </div>
            {action}
        </div>
    );
}
