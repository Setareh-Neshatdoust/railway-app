import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDirectTrain } from '../api/client'
import type { DirectTrainResponse } from '../api/types'
import { useApiRequest } from '../hooks/useApiRequest'
import { routeSearchToUrl } from '../routes/searchParams'
import { formatItalianDate } from '../utils/dates'

interface DirectTrainNoticeProps {
  origin: string
  destination: string
  startDate?: string // when both dates are known, the notice links to the same search as "Any two stops"
  endDate?: string
}

// The message for the route (trains that start at the origin and end at the destination),
// the same trains the route analysis counts. null = nothing to say.
function routeMessage(data: DirectTrainResponse): string | null {
  const { origin, destination } = data
  const since = data.last_seen ? formatItalianDate(data.last_seen) : null
  const through = data.through_last_seen ? formatItalianDate(data.through_last_seen) : null
  const times = data.count === 1 ? 'once' : `${data.count} times`

  switch (data.relation) {
    case 'active':
      return null
    case 'occasional':
      return `Only an occasional train has run on this route: ${times}, the last on ${since}.`
    case 'special_only':
      return `Only special trains have run on this route${since ? `, the last on ${since}` : ''}.`
    case 'inactive':
      return through
        ? `Direct trains from ${origin} to ${destination} still run (last on ${through}), but they start or end at other stations, so this route analysis has no recent data${since ? ` (last on ${since})` : ''}.`
        : `No direct train between ${origin} and ${destination} in the last 7 days.${since ? ` The last train on this route ran on ${since}.` : ''}`
    case 'empty':
      return through
        ? `Direct trains from ${origin} to ${destination} run (last on ${through}), but none starts and ends at these two stations, so this route analysis has no data.`
        : `TrainStats has no train between ${origin} and ${destination}.`
  }
}

// Shown in Route mode only. Nothing while loading, for active routes, or if the check fails.
export function DirectTrainNotice({ origin, destination, startDate, endDate }: DirectTrainNoticeProps) {
  const params = useMemo(
    () => (origin && destination ? { origin, destination } : null),
    [origin, destination],
  )
  const { data } = useApiRequest(params, getDirectTrain)

  if (!data) return null
  const message = routeMessage(data)
  if (!message) return null

  // Trains pass through both stations: offer the same search as "Any two stops"
  const stopsLink = data.through_last_seen && startDate && endDate
    ? `/?${new URLSearchParams(routeSearchToUrl({ origin, destination, startDate, endDate, includeStations: false, mode: 'stops' }))}`
    : null

  return (
    <div role="status" className="border border-signal-warn text-signal-warn rounded-md px-3 py-2 text-sm">
      {message}
      {data.through_last_seen && (
        stopsLink
          ? <>{' '}<Link to={stopsLink} className="font-medium underline hover:no-underline">Search as “Any two stops” →</Link></>
          : <>{' '}Choose “Any two stops” above to analyse them.</>
      )}
    </div>
  )
}