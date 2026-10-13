import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSegmentStats } from '../api/client'
import { DownloadButton } from '../components/DownloadButton'
import { ErrorMessage } from '../components/ErrorMessage'
import { SegmentResult } from '../components/SegmentResult'
import { useApiRequest } from '../hooks/useApiRequest'
import { segmentSearchFromUrl } from '../routes/searchParams'
import { formatItalianDate } from '../utils/dates'
import { SEGMENT_TRAIN_COLUMNS } from '../utils/exportColumns'
import { downloadCsv, downloadJson, makeFileName } from '../utils/exports'

// From the origin to one intermediate stop, opened by clicking a station on Route analysis
export function SegmentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const search = useMemo(() => segmentSearchFromUrl(searchParams), [searchParams])
  const { data, error, isLoading } = useApiRequest(search, getSegmentStats)

  if (!search) {
    return <div className="p-6"><ErrorMessage message="Missing origin, destination or dates in the address." /></div>
  }

  const baseName = makeFileName(['segment', search.origin, search.destination, formatItalianDate(search.startDate), formatItalianDate(search.endDate)])

  return (
    <div className="p-6 max-w-3xl">
      <button type="button" onClick={() => navigate(-1)} className="text-sm text-accent hover:underline mb-4">
        ← Back to route analysis
      </button>
      <h2 className="text-base font-medium">{search.origin} → {search.destination}</h2>
      <p className="text-xs text-muted mb-4">
        {formatItalianDate(search.startDate)} – {formatItalianDate(search.endDate)} · every train that stopped at {search.origin} and then at {search.destination}
      </p>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && <ErrorMessage message={error} />}

      {data && (
        <>
          <div className="flex gap-2 mb-4">
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
          <SegmentResult data={data} />
        </>
      )}
    </div>
  )
}