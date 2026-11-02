import { Link } from 'react-router-dom'
import type { DayStats } from '../api/types'
import { useCollapsibleList } from '../hooks/useCollapsibleList'
import { formatItalianDate } from '../utils/dates'
import { formatValue, getDelayColor } from '../utils/format'
import { ShowMoreButton } from './ShowMoreButton'

interface DayByDayTableProps {
  days: DayStats[]
  threshold: number
  stopsLinkFor: (isoDate: string) => string 
}

// What happened on one day, in words; the colour repeats the meaning, it never carries it alone
function outcome(day: DayStats, threshold: number): { text: string; className: string } {
  if (day.cancelled_count > 0) return { text: 'Cancelled', className: 'text-signal-bad' }
  if (day.avg_arrival_delay_min === null) return { text: 'No arrival recorded', className: 'text-muted' }
  if (day.avg_arrival_delay_min <= threshold) return { text: 'On time', className: 'text-signal-good' }
  return { text: 'Delayed', className: 'text-signal-warn' }
}

// One row per day the train ran in the period, each with a link to that day's stops
export function DayByDayTable({ days, threshold, stopsLinkFor }: DayByDayTableProps) {
  const list = useCollapsibleList(days, 10)

  if (days.length === 0) {
    return (
      <p className="border border-line rounded-md px-4 py-3 text-sm text-muted">
        No day with recorded data in this period.
      </p>
    )
  }

  return (
    <div className="border border-line rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-panel text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium text-right">Departure delay</th>
            <th className="px-3 py-2 font-medium text-right">Arrival delay</th>
            <th className="px-3 py-2 font-medium">What happened</th>
            <th className="px-3 py-2 font-medium"><span className="sr-only">Stops</span></th>
          </tr>
        </thead>
        <tbody>
          {list.visibleItems.map((day) => {
            const result = outcome(day, threshold)
            return (
              <tr key={day.date} className="border-t border-line">
                <td className="px-3 py-2 font-mono">{formatItalianDate(day.date)}</td>
                <td className={`px-3 py-2 font-mono text-right ${getDelayColor(day.avg_departure_delay_min)}`}>
                  {formatValue(day.avg_departure_delay_min, 'm')}
                </td>
                <td className={`px-3 py-2 font-mono text-right ${getDelayColor(day.avg_arrival_delay_min)}`}>
                  {formatValue(day.avg_arrival_delay_min, 'm')}
                </td>
                <td className="px-3 py-2">
                  <span className={`font-medium ${result.className}`}>{result.text}</span>
                  {day.notes.length > 0 && (
                    <span className="block text-xs text-muted">{day.notes.join(' · ')}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link to={stopsLinkFor(day.date)} className="text-accent hover:underline whitespace-nowrap">
                    Stops detail
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {list.canToggle && (
        <ShowMoreButton expanded={list.expanded} hiddenCount={list.hiddenCount} onToggle={list.toggle} />
      )}
    </div>
  )
}