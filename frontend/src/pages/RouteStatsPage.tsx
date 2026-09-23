
import { useState } from 'react'
import { getRouteStats, ApiError } from '../api/client'
import type { RouteStatsResponse } from '../api/types'
import { RouteSearchForm, type RouteSearchValues } from '../components/RouteSearchForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { Link } from 'react-router-dom'

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

interface StatCardProps {
  label: string
  value: string
  colorClass: string
}

function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className="bg-panel border border-line rounded-md p-3">
      <div className="text-xs text-muted mb-1.5">{label}</div>
      <div className={`font-mono text-2xl font-medium ${colorClass}`}>{value}</div>
    </div>
  )
}

export function RouteStatsPage() {
  const [result, setResult] = useState<RouteStatsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchedOrigin, setSearchedOrigin] = useState('')
  const [searchedStartDate, setSearchedStartDate] = useState('')

  async function handleSearch(values: RouteSearchValues) {
  setIsLoading(true)
  setError(null)
  setResult(null)
  setSearchedOrigin(values.origin)
  setSearchedOrigin(values.origin)
  setSearchedStartDate(values.startDate)

  try {
    const data = await getRouteStats({ 
      origin:values.origin, 
      destination:values.destination, 
      startDate:values.startDate, 
      endDate:values.endDate
     })
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
return (
  <div className="p-6 max-w-3xl">
    <h2 className="text-base font-medium mb-4">Route statistics</h2>

    <RouteSearchForm onSubmit={handleSearch} isLoading={isLoading} />

   {error && <ErrorMessage message={error} />}

      {result && (
  <div>
    <div className="grid grid-cols-3 gap-3 mb-6">
      <StatCard
        label="On-time"
        value={formatValue(result.overall.on_time_percentage, '%')}
        colorClass={getPercentageColor(result.overall.on_time_percentage)}
      />
      <StatCard
        label="Avg arrival delay"
        value={formatValue(result.overall.avg_arrival_delay_min, 'm')}
        colorClass="text-signal-warn"
      />
      <StatCard
        label="Cancelled"
        value={formatValue(result.overall.cancellation_rate_pct, '%')}
        colorClass={result.overall.cancellation_rate_pct ? 'text-signal-bad' : 'text-signal-good'}
      />
    </div>

    <h3 className="text-sm text-muted mb-2">By train ({result.trains_analyzed} analyzed)</h3>
    <div className="border border-line rounded-md divide-y divide-line">
      {result.by_train.map((train) => (
        <div key={train.train_number} className="flex items-center px-4 py-2 text-sm">
          <Link
            to={`/stops?train_number=${encodeURIComponent(train.train_number)}&origin=${encodeURIComponent(searchedOrigin)}&travel_date=${encodeURIComponent(searchedStartDate)}`}
            className="flex-1 text-accent hover:underline"
           >
            {train.train_number} ({train.category})
           </Link>
          <span className="font-mono text-muted mr-4">{train.total_records} records</span>
          <span className={`font-mono ${getPercentageColor(train.on_time_percentage)}`}>
            {formatValue(train.on_time_percentage, '%')}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
  </div>
)


}
