import { getTrainStops} from '../api/client'
import type {TrainStop } from '../api/types'
import { TrainStopsSearchForm, type TrainStopsSearchValues } from '../components/TrainStopsSearchForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useApiRequest } from '../hooks/useApiRequest'
import { trainStopsSearchfromUrl, trainStopsSearchToUrl } from '../routes/searchParams'
import { DownloadButton } from '../components/DownloadButton'
import { downloadCsv, downloadJson, makeFileName } from '../utils/exports' 
import { STOP_COLUMNS } from '../utils/exportColumns'
import { formatItalianDate } from '../utils/dates'
import { BackLink } from '../components/BackLink'
import { Section } from '../components/Section'

function displayValue(value: string | null): string {
  return value ? value : '—'
}

function StopRow({ stop }: { stop: TrainStop }) {
  return (
    <tr className="border-t border-line">
      <td className="px-3 py-2 font-mono text-muted">{stop.stop_number}</td>
      <td className="px-3 py-2">{stop.station}</td>
      <td className="px-3 py-2 font-mono text-muted">{displayValue(stop.platform_scheduled)}</td>
      <td className="px-3 py-2 font-mono text-muted">{displayValue(stop.platform_actual)}</td>
      <td className="px-3 py-2 font-mono">{displayValue(stop.arrival_scheduled)}</td>
      <td className="px-3 py-2 font-mono">{displayValue(stop.arrival_actual)}</td>
      <td className="px-3 py-2 font-mono">{displayValue(stop.arrival_delay)}</td>
      <td className="px-3 py-2 font-mono">{displayValue(stop.departure_scheduled)}</td>
      <td className="px-3 py-2 font-mono">{displayValue(stop.departure_actual)}</td>
      <td className="px-3 py-2 font-mono">{displayValue(stop.departure_delay)}</td>
    </tr>
  )
}

export function TrainStopsPage() {
  const [searchParams,setSearchParams] = useSearchParams()
  const search = useMemo(()=>trainStopsSearchfromUrl(searchParams),[searchParams])
  const {data:result, error, isLoading} = useApiRequest(search, getTrainStops)
  const [notice, setNotice] = useState<string | null>(null)
  
    function handleSearch(values: TrainStopsSearchValues) {
    // Same train, station and day as the one already shown: nothing to load, so tell the user why nothing changes
    const isSameSearch = search !== null
      && values.trainNumber.trim() === search.trainNumber
      && values.origin === search.origin
      && values.travelDate === search.travelDate
    if (isSameSearch) {
      setNotice(`These are already the stops of train ${search.trainNumber} on ${formatItalianDate(search.travelDate)}. Choose another date or train to see different data.`)
      return
    }
    setNotice(null)
    const back = searchParams.get('back')
    setSearchParams(back ? { ...trainStopsSearchToUrl(values), back } : trainStopsSearchToUrl(values))
  }
  
  return (
    <div className="space-y-6">
       <BackLink label="Back to train analysis" />
       <div>
        <h2 className="text-xl font-medium">Train stops</h2>
       <p className="text-sm text-muted mt-1">
         Every intermediate stop for one train on one specific day, with platform numbers.
       </p>
       </div>
       <Section title="Search">
      <TrainStopsSearchForm 
        key={searchParams.toString()}
        onSubmit={handleSearch}
        isLoading={isLoading}
        initialTrainNumber={search?.trainNumber}
        initialOrigin={search?.origin} 
        initialTravelDate={search?.travelDate}
        />
      </Section>
      
      {notice && (
        <p role="status" className="border border-accent text-accent rounded-md px-4 py-3 text-sm">
          {notice}
        </p>
      )}

      {error && <ErrorMessage message={error} />}

            {result && search && (
        <div className="flex gap-2 mb-4">
          <DownloadButton
            label="Stops (CSV)"
            onClick={() => downloadCsv(`${makeFileName(['stops', search.trainNumber, search.origin, formatItalianDate(search.travelDate)])}.csv`, result.stops, STOP_COLUMNS)}
          />
          <DownloadButton
            label="JSON"
            onClick={() => downloadJson(`${makeFileName(['stops', search.trainNumber, search.origin, formatItalianDate(search.travelDate)])}.json`, {
              source: 'TrainStats (trainstats.altervista.org)',
              generated_at: new Date().toISOString(),
              ...result,
            })}
          />
        </div>
      )}

      {result && (
        <div className="border border-line rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium" rowSpan={2}>#</th>
                <th className="px-3 py-2 font-medium" rowSpan={2}>Station</th>
                <th className="px-3 py-2 font-medium text-center" colSpan={2}>Platform</th>
                <th className="px-3 py-2 font-medium text-center" colSpan={3}>Arrival</th>
                <th className="px-3 py-2 font-medium text-center" colSpan={3}>Departure</th>
              </tr>
              <tr className="bg-panel text-left text-xs text-muted border-t border-line">
                <th className="px-3 py-1 font-medium">Sched.</th>
                <th className="px-3 py-1 font-medium">Actual</th>
                <th className="px-3 py-1 font-medium">Sched.</th>
                <th className="px-3 py-1 font-medium">Actual</th>
                <th className="px-3 py-1 font-medium">Delay</th>
                <th className="px-3 py-1 font-medium">Sched.</th>
                <th className="px-3 py-1 font-medium">Actual</th>
                <th className="px-3 py-1 font-medium">Delay</th>
              </tr>
            </thead>
            <tbody>
              {result.stops.map((stop) => (
                <StopRow key={stop.stop_number} stop={stop} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}