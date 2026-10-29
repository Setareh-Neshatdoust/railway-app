import { useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getSegmentStats } from '../api/client'
import { BackLink } from '../components/BackLink'
import { DownloadButton } from '../components/DownloadButton'
import { ErrorMessage } from '../components/ErrorMessage'
import { SegmentResult } from '../components/SegmentResult'
import { useApiRequest } from '../hooks/useApiRequest'
import { segmentSearchFromUrl, backFromUrl } from '../routes/searchParams'
import { formatItalianDate } from '../utils/dates'
import { SEGMENT_TRAIN_COLUMNS } from '../utils/exportColumns'
import { downloadCsv, downloadJson, makeFileName } from '../utils/exports'
import { AlertModal } from '../components/AlertModal'

// From the origin to one intermediate stop, opened by clicking a station on Route analysis
export function SegmentPage() {
  const [searchParams] = useSearchParams()
  const search = useMemo(() => segmentSearchFromUrl(searchParams), [searchParams])
  const { data, error, isLoading } = useApiRequest(search, getSegmentStats)
  const navigate = useNavigate()

  if (!search) {
    return <ErrorMessage message="Missing origin, destination or dates in the address." />
  }

  const period = `${formatItalianDate(search.startDate)} – ${formatItalianDate(search.endDate)}`
  const baseName = makeFileName(['segment', search.origin, search.destination, formatItalianDate(search.startDate), formatItalianDate(search.endDate)])

  return (
    <div className="space-y-6">
      <BackLink label="Back to route analysis" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">{search.origin} → {search.destination}</h2>
          <p className="text-sm text-muted mt-1">
            {period} · every train that stopped at {search.origin} and then at {search.destination}
          </p>
        </div>
        {data && (
          <div className="flex flex-wrap gap-2">
            <DownloadButton
              label="Trains (CSV)"
              onClick={() => downloadCsv(`${baseName}_trains.csv`, data.by_train, SEGMENT_TRAIN_COLUMNS)}
            />
            <DownloadButton
              label="All (JSON)"
              onClick={() => downloadJson(`${baseName}.json`, {
                source: 'TrainStats (trainstats.altervista.org)',
                generated_at: new Date().toISOString(),
                ...data,
              })}
            />
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && <AlertModal message={error} onClose={() => navigate(backFromUrl(searchParams))} />}
      {data && <SegmentResult data={data} period={period} />}
    </div>
  )
}