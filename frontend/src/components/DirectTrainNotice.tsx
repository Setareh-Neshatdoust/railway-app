import { useMemo } from 'react'
import { getDirectTrain } from '../api/client'
import { useApiRequest } from '../hooks/useApiRequest'
import { formatItalianDate } from '../utils/dates'

interface DirectTrainNoticeProps {
  origin: string
  destination: string
}

// Tells the user when no regular direct train runs between the two stations today.
// Shows nothing while loading, when a direct train runs, or if the check fails.
export function DirectTrainNotice({ origin, destination }: DirectTrainNoticeProps) {
  const params = useMemo(
    () => (origin && destination ? { origin, destination } : null),
    [origin, destination],
  )
  const { data } = useApiRequest(params, getDirectTrain)

  if (!data) return null
  const since = data.last_seen ? formatItalianDate(data.last_seen) : null

  let message: string
  if (data.status === 'special_only') {
    message = `Only special trains have run between these stations${since ? `, the last on ${since}` : ''}. There is no regular direct train.`
  } else if (data.status === 'no_direct_train') {
    message = since
      ? `No direct train since ${since}. The results show the past performance of this route.`
      : 'No direct train in the last 7 days. The results show the past performance of this route.'
  } else {
    return null
  }

  return (
    <div role="status" className="border border-signal-warn text-signal-warn rounded-md px-3 py-2 text-sm">
      {message}
    </div>
  )
}