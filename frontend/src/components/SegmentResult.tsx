import type { SegmentStatsResponse } from '../api/types'
import { useCollapsibleList } from '../hooks/useCollapsibleList'
import { formatValue, getDelayColor, getPercentageColor } from '../utils/format'
import { ChartSlot } from './ChartSlot'
import { Section } from './Section'
import { ShowMoreButton } from './ShowMoreButton'
import { StatsSummary } from './StatsSummary'
import { PageNav } from './PageNav'
import { CategoryBadge, CategoryLegend } from './CategoryBadge'

// Statistics between the origin and one intermediate stop, the same method as
// TrainStats' "Cerca per fermate": every train that stopped at both stations.
export function SegmentResult({ data, period }: { data: SegmentStatsResponse, period: string }) {
  const trains = useCollapsibleList(data.by_train, 5)
  return (
    <>
      <PageNav items={[
        { id: 'summary', label: 'Summary' },
        { id: 'over-time', label: 'Over time' },
        { id: 'by-train', label: 'By train' },
      ]} />
      <StatsSummary summary={data.overall} period={period} />
      <p className="text-sm text-muted">
        Avg departure delay at {data.origin}:{' '}
        <span className={`font-mono ${getDelayColor(data.overall.avg_departure_delay_min)}`}>
          {formatValue(data.overall.avg_departure_delay_min, 'm')}
        </span>
      </p>

      <Section id="over-time" title="Over time">
        <ChartSlot
          title="Average arrival delay by day"
          shows="One point per day in the period, so trends and bad days stand out."
        />
      </Section>

      <Section id="by-train" title={`By train (${data.by_train.length})`} description="Trains that stopped at both stations in this period.">
        <ChartSlot
          title="On-time rate by train"
          shows="One bar per train, sorted from best to worst, on a common scale from 0 to 100%."
        />
        <div className="mb-3"><CategoryLegend /></div>
        <div className="border border-line rounded-md divide-y divide-line">
          {trains.visibleItems.map((train) => (
            <div key={train.train_number} className="flex items-center gap-3 px-4 py-2 text-sm">
              <CategoryBadge category={train.category} />
              <span className="flex-1">
                {train.train_number}
                <span className="text-xs text-muted ml-2">
                  {train.train_origin} → {train.train_destination}
                </span>
              </span>
              <span className="font-mono text-muted mr-4" title="Days on which this train has recorded data">
                {train.total_records} days
              </span>
              <span
                className={`font-mono ${getPercentageColor(train.on_time_percentage)}`}
                title={`On-time rate: arrived at most ${train.on_time_threshold_minutes} min late`}
              >
                {formatValue(train.on_time_percentage, '%')}
              </span>
            </div>
          ))}
          {trains.canToggle && (
            <ShowMoreButton expanded={trains.expanded} hiddenCount={trains.hiddenCount} onToggle={trains.toggle} />
          )}
        </div>
      </Section>
    </>
  )
}