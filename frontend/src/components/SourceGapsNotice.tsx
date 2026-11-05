import { formatItalianDate } from '../utils/dates'

interface SourceGapsNoticeProps {
  trains?: string[]   // trains whose daily records TrainStats did not send
  stopTables?: number // stop tables TrainStats did not send
  days?: string[]     // ISO dates TrainStats did not answer for (By stops)
}

// TrainStats did not answer some requests: say what is missing, so the figures are not read as complete
export function SourceGapsNotice({ trains = [], stopTables = 0, days = [] }: SourceGapsNoticeProps) {
  const parts: string[] = []
  if (trains.length > 0) parts.push(`the daily records of ${trains.length === 1 ? 'train' : 'trains'} ${trains.join(', ')}`)
  if (stopTables > 0) parts.push(`${stopTables} stop ${stopTables === 1 ? 'table' : 'tables'}`)
  if (days.length > 0) parts.push(`${days.length} ${days.length === 1 ? 'day' : 'days'} (${days.map(formatItalianDate).join(', ')})`)
  if (parts.length === 0) return null

  return (
    <p role="status" className="rounded-md border border-signal-warn px-4 py-3 text-sm text-signal-warn">
      TrainStats did not answer for {parts.join(' and ')}, so they are not included in the figures below.
      Reload the page to try again.
    </p>
  )
}