import { useEffect,useState } from 'react'
import { getTrainStops, ApiError } from '../api/client'
import type { TrainStopsResponse, TrainStop } from '../api/types'
import { TrainStopsSearchForm, type TrainStopsSearchValues } from '../components/TrainStopsSearchForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { useSearchParams } from 'react-router-dom'

function displayValue(value: string | null): string {
  return value ? value : '—'
}

function StopRow({ stop }: { stop: TrainStop }) {
  return (
    <tr className="border-t border-line">
      <td className="px-3 py-2 font-mono text-muted">{stop.stop_number}</td>
      <td className="px-3 py-2">{stop.station}</td>
      <td className="px-3 py-2 font-mono text-muted">{displayValue(stop.platform)}</td>
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
  const [searchParams] = useSearchParams()
  const initialTrainNumber = searchParams.get('train_number') ?? ''
  const initialOrigin = searchParams.get('origin') ?? ''
  const initialTravelDate = searchParams.get('travel_date')?? ''
  const [result, setResult] = useState<TrainStopsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSearch(values: TrainStopsSearchValues) {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await getTrainStops(values)
      setResult(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something unexpected went wrong.')
      }
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (initialTrainNumber && initialOrigin && initialTravelDate){
        handleSearch
        ({
            trainNumber: initialTrainNumber,
            origin: initialOrigin,
            travelDate: initialTravelDate
        })
    }
  }, [searchParams.toString()])

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
        initialTrainNumber={initialTrainNumber}
        initialOrigin={initialOrigin} 
        initialTravelDate={initialTravelDate}
        />

      {error && <ErrorMessage message={error} />}

      {result && (
        <div className="border border-line rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium" rowSpan={2}>#</th>
                <th className="px-3 py-2 font-medium" rowSpan={2}>Station</th>
                <th className="px-3 py-2 font-medium" rowSpan={2}>Platform</th>
                <th className="px-3 py-2 font-medium text-center" colSpan={3}>Arrival</th>
                <th className="px-3 py-2 font-medium text-center" colSpan={3}>Departure</th>
              </tr>
              <tr className="bg-panel text-left text-xs text-muted border-t border-line">
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