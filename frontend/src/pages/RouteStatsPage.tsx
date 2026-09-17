
import { useState,type FormEvent } from 'react'
import { getRouteStats, ApiError } from '../api/client'
import type { RouteStatsResponse } from '../api/types'

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
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [result, setResult] = useState<RouteStatsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  setIsLoading(true)
  setError(null)
  setResult(null)

  try {
    const data = await getRouteStats({ origin, destination, startDate, endDate })
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

    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
      <label className="flex flex-col gap-1 text-sm">
        Origin
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          required
          className="bg-panel border border-line rounded-md px-3 py-2 text-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Destination
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          className="bg-panel border border-line rounded-md px-3 py-2 text-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Start date
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="bg-panel border border-line rounded-md px-3 py-2 text-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        End date
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          className="bg-panel border border-line rounded-md px-3 py-2 text-primary"
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="col-span-2 bg-accent text-white rounded-md py-2 font-medium disabled:opacity-50"
      >
        {isLoading ? 'Loading…' : 'Get stats'}
      </button>
    </form>

    {error && (
      <div className="border border-signal-bad text-signal-bad rounded-md px-4 py-3 mb-6 text-sm">
        {error}
      </div>
    )}
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
          <span className="flex-1">{train.train_number} ({train.category})</span>
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
