import type { SegmentStatsResponse } from '../api/types'
import { useCollapsibleList } from '../hooks/useCollapsibleList'
import { formatValue, getDelayColor, getPercentageColor } from '../utils/format'
import { ShowMoreButton } from './ShowMoreButton'
import { StatsSummary } from './StatsSummary'

// Statistics between the origin and one intermediate stop, the same method as
// TrainStats' "Cerca per fermate": every train that stopped at both stations.
export function SegmentResult({ data }: { data: SegmentStatsResponse }) {
  const trains = useCollapsibleList(data.by_train, 5)
  return (
    <>
      <StatsSummary summary={data.overall} />
      <p className="text-sm text-muted mb-4">
        Avg departure delay at {data.origin}:{' '}
        <span className={`font-mono ${getDelayColor(data.overall.avg_departure_delay_min)}`}>
          {formatValue(data.overall.avg_departure_delay_min, 'm')}
        </span>
        {' · '}{data.overall.total_records} train runs, {data.overall.cancelled_count} cancelled
      </p>

      <h3 className="text-sm text-muted mb-2">By train ({data.by_train.length})</h3>
      <div className="border border-line rounded-md divide-y divide-line">
        {trains.visibleItems.map((train) => (
          <div key={train.train_number} className="flex items-center px-4 py-2 text-sm">
            <span className="flex-1">
              {train.train_number} ({train.category})
              <span className="text-xs text-muted ml-2">
                {train.train_origin} → {train.train_destination}
              </span>
            </span>
            <span className="font-mono text-muted mr-4">{train.total_records} records</span>
            <span className={`font-mono ${getPercentageColor(train.on_time_percentage)}`}>
              {formatValue(train.on_time_percentage, '%')}
            </span>
          </div>
        ))}
        {trains.canToggle && (
          <ShowMoreButton expanded={trains.expanded} hiddenCount={trains.hiddenCount} onToggle={trains.toggle} />
        )}
      </div>
    </>
  )
}