import type { SegmentStatsResponse, SegmentTrainStats } from '../api/types'
import { useCollapsibleList } from '../hooks/useCollapsibleList'
import { formatValue, getDelayColor, getPercentageColor} from '../utils/format'
import { Section } from './Section'
import { ShowMoreButton } from './ShowMoreButton'
import { StatsSummary } from './StatsSummary'
import { PageNav } from './PageNav'
import { CategoryBadge, CategoryLegend } from './CategoryBadge'
import { Link } from 'react-router-dom'
import { InfoTip } from './InfoTip'
import { OnTimeByTrainChart } from './OnTimeByTrainChart'
import { DelayByDayChart } from './DelayByDayChart'

// linkFor (optional) gives the address of a train's own analysis
interface SegmentResultProps {
  data: SegmentStatsResponse
  period: string
  linkFor?: (train: SegmentTrainStats) => string
}
// Statistics between the origin and one intermediate stop, the same method as
// TrainStats' "Cerca per fermate": every train that stopped at both stations.
export function SegmentResult({ data, period, linkFor }: SegmentResultProps) {
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
        <DelayByDayChart days={data.by_day} threshold={data.overall.on_time_threshold_minutes} />
      </Section>

      <Section id="by-train" title={`By train (${data.by_train.length})`} description={`Trains that stopped at both stations in this period.${linkFor ? " Click a train to see its whole journey." : ""}`}>
        <OnTimeByTrainChart trains={data.by_train} linkFor={linkFor} />
        <div className="mb-3"><CategoryLegend /></div>
        <div className="border border-line rounded-md divide-y divide-line">
            <div className="flex items-center gap-3 bg-panel px-4 py-2 text-xs font-medium text-muted">
            <span className="flex-1">Train</span>
            <span className="w-28 text-center">
              Trips
              <InfoTip
                align="right"
                text={`Days on which the train stopped at ${data.origin} and then at ${data.destination}, wherever it started or ended, cancelled trips included.`}
              />
            </span>
            <span className="w-28 text-center">On time (≤ {data.overall.on_time_threshold_minutes} min)</span>
            <span className="w-44">Note</span>
          </div>
          {trains.visibleItems.map((train) => (
            <div key={train.train_number} className="flex items-center gap-3 px-4 py-2 text-sm">
              <CategoryBadge category={train.category} />
              <span className="flex-1">
                {linkFor ? (
                  <Link to={linkFor(train)} className="text-accent hover:underline">{train.train_number}</Link>
                ) : (
                  train.train_number
                )}
                <span className="text-xs text-muted ml-2">
                  {train.train_origin} → {train.train_destination}
                </span>
              </span>
              <span className="w-28 text-center font-mono text-muted">
                {train.total_records}
                {train.cancelled_count > 0 && (
                  <span className="block font-sans text-xs text-signal-bad">{train.cancelled_count} cancelled</span>
                )}
              </span>
              <span
                className={`w-28 text-center font-mono ${getPercentageColor(train.on_time_percentage)}`}
                title={`On-time rate: arrived at most ${train.on_time_threshold_minutes} min late`}
              >
                {formatValue(train.on_time_percentage, '%')}
              </span>
              <span className="w-44 text-xs text-muted">
                {train.other_destinations.length > 0 && `Some days ended to ${train.other_destinations.join(', ')}`}
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