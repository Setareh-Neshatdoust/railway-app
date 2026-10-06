import { getRouteStats} from '../api/client'
import type { StationStats } from '../api/types'
import { RouteSearchForm, type RouteSearchValues } from '../components/RouteSearchForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApiRequest } from '../hooks/useApiRequest'
import { routeSearchFromUrl, routeSearchToUrl } from '../routes/searchParams'

function formatValue(value: number | null, suffix = ''): string {
  if (value === null) return '—'
  return `${value}${suffix}`
}

function getPercentageColor(pct: number | null): string {
  if (pct === null) return 'text-signal-neutral'
  if (pct >= 80) return 'text-signal-good'
  if (pct >= 50) return 'text-signal-warn'
  return 'text-signal-bad'
}

function StationRow({ station }: { station: StationStats }) {
  return (
    <tr className="border-t border-line">
      <td className="px-3 py-2">{station.station}</td>
      <td className="px-3 py-2 font-mono text-muted text-right">
        {station.days_with_data}/{station.days_checked}
      </td>
      <td className="px-3 py-2 font-mono text-right">
        {formatValue(station.avg_arrival_delay_min, 'm')}
      </td>
      <td className="px-3 py-2 font-mono text-right">
        {formatValue(station.avg_departure_delay_min, 'm')}
      </td>
      <td className={`px-3 py-2 font-mono text-right ${getPercentageColor(station.on_time_percentage)}`}>
        {formatValue(station.on_time_percentage, '%')}
      </td>
    </tr>
  )
}

export function StationAnalysisPage() {
  const[searchParams, setSearchParams] = useSearchParams()

  const search = useMemo (()=>{
    const values = routeSearchFromUrl(searchParams)
    return values ? { ...values, includeStation: true} :null
  },[searchParams])
  const {data: result ,error, isLoading} = useApiRequest(search, getRouteStats)

  function handleSearch(values: RouteSearchValues) {

    setSearchParams(routeSearchToUrl(values))
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-base font-medium mb-1">Station analysis</h2>
      <p className="text-sm text-muted mb-4">
        Delay and punctuality at every intermediate station along the route.
      </p>

      <RouteSearchForm 
      key={searchParams.toString()}
      initialValues={search}
      onSubmit={handleSearch} 
      isLoading={isLoading} />

     {error && <ErrorMessage message={error} />}


      {result && (
        <div className="border border-line rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Station</th>
                <th className="px-3 py-2 font-medium text-right">Data</th>
                <th className="px-3 py-2 font-medium text-right">Arr. delay</th>
                <th className="px-3 py-2 font-medium text-right">Dep. delay</th>
                <th className="px-3 py-2 font-medium text-right">On-time</th>
              </tr>
            </thead>
            <tbody>
              {result.by_station.map((station) => (
                <StationRow key={`${station.stop_number}-${station.station}`} station={station} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}