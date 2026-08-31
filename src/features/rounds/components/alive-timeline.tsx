import { buildAliveTimeline } from '@/features/rounds/round-analytics';
import type { FullRoundType } from '@/features/rounds/round-data';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { StatsChart } from '@/shared/components/ui/stats-chart';

export function AliveTimeline({ round }: { round: FullRoundType }) {
    const timeline = buildAliveTimeline(round);

    return (
        <section className="mb-3.5 rounded-2xl border border-(--line) bg-(--panel) p-6 max-[559px]:p-4.25">
            <SectionHeading title="Players alive by team" />
            <p className="-mt-3 mb-4 text-(--muted) text-xs">
                Flowing bands show each team’s connected living-player count after events or disconnects and at round
                end. Hover a point for exact values.
            </p>
            {timeline.hasChanges ? (
                <StatsChart
                    type="line"
                    labels={timeline.labels}
                    datasets={timeline.datasets}
                    height={280}
                />
            ) : (
                <EmptyState
                    title="No timeline"
                    message="This round has no recorded events."
                />
            )}
        </section>
    );
}
