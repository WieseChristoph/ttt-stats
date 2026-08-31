import { aggregateRoundWeapons } from '@/features/rounds/round-analytics';
import type { FullRoundType } from '@/features/rounds/round-data';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { formatWeaponLabel, percentage } from '@/shared/stats';
import { formatPercentage } from '@/shared/utils/format';

export function RoundWeapons({ round }: { round: FullRoundType }) {
    const weapons = aggregateRoundWeapons(round);

    return (
        <section className="mt-3.5 rounded-2xl border border-(--line) bg-(--panel) p-6 max-[559px]:p-4.25">
            <SectionHeading title="Round weapons" />
            {weapons.length ? (
                <div className="grid gap-1">
                    <div className="grid grid-cols-[minmax(0,1fr)_64px_64px_64px] gap-2 px-3 pb-1 font-semibold text-(--muted) text-[9px] uppercase [&>span:not(:first-child)]:text-right">
                        <span>Weapon</span>
                        <span>Kills</span>
                        <span>Users</span>
                        <span>Accuracy</span>
                    </div>
                    {weapons.map(({ weapon, stats }) => (
                        <div
                            className="grid grid-cols-[minmax(0,1fr)_repeat(3,64px)] gap-2 rounded-lg px-3 py-2 text-xs hover:bg-white/4"
                            key={weapon}
                        >
                            <strong className="truncate">{formatWeaponLabel(weapon)}</strong>
                            <span className="text-right">{stats.kills} kills</span>
                            <span className="text-right text-(--muted)">{stats.users} users</span>
                            <span className="text-right">{formatPercentage(percentage(stats.hits, stats.shots))}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No weapon data"
                    message="No weapon breakdown was recorded for this round."
                />
            )}
        </section>
    );
}
