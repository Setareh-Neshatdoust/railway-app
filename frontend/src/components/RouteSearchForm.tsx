import { useState, type FormEvent } from 'react'
import { useStations } from '../hooks/useStations'
import { StationAutocomplete } from './StationAutocomplete'

export interface RouteSearchValues {
  origin: string
  destination: string
  startDate: string
  endDate: string
}

interface RouteSearchFormProps {
  onSubmit: (values: RouteSearchValues) => void
  isLoading: boolean
}

export function RouteSearchForm({ onSubmit, isLoading }: RouteSearchFormProps) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { stations } = useStations()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ origin, destination, startDate, endDate })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
      <StationAutocomplete
        label="Origin"
        value={origin}
        onChange={setOrigin}
        options={stations}
      />

      <StationAutocomplete
        label="Destination"
        value={destination}
        onChange={setDestination}
        options={stations}
      />

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
  )
}