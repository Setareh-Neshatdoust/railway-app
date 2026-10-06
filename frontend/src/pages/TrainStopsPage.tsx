import { getTrainStops} from '../api/client'
import type {TrainStop } from '../api/types'
import { TrainStopsSearchForm, type TrainStopsSearchValues } from '../components/TrainStopsSearchForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useApiRequest } from '../hooks/useApiRequest'
import { trainStopsSearchfromUrl, trainStopsSearchToUrl } from '../routes/searchParams'

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
  
  function handleSearch(values: TrainStopsSearchValues) {
    setSearchParams(trainStopsSearchToUrl(values))

  }
  
  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-base font-medium mb-1">Train stops</h2>
      <p className="text-sm text-muted mb-4">
        Every intermediate stop for one train on one specific day, with platform numbers.
      </p>

      <TrainStopsSearchForm 
        key={searchParams.toString()}
        onSubmit={handleSearch}
        isLoading={isLoading}
        initialTrainNumber={search?.trainNumber}
        initialOrigin={search?.origin} 
        initialTravelDate={search?.travelDate}
        />

      {error && <ErrorMessage message={error} />}

      {result && (
        <div className="border border-line rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium" rowSpan={2}>#</th>
                <th className="px-3 py-2 font-medium" rowSpan={2}>Station</th>
                <th className="px-3 py-2 font-medium" colSpan={2}>Platform</th>
                <th className="px-3 py-2 font-medium text-center" colSpan={3}>Arrival</th>
                <th className="px-3 py-2 font-medium text-center" colSpan={3}>Departure</th>
              </tr>
              <tr className="bg-panel text-left text-xs text-muted border-t border-line">
                <th className="px-3 py-1 font-medium">Sched.</th>
                <th className="px-3 py-1 font-medium">Actual</th>
                <th className="px-3 py-1 font-medium">Delay</th>
                <th className="px-3 py-1 font-medium">sched</th>
                <th className="px-3 py-1 font-medium">Actual</th>
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