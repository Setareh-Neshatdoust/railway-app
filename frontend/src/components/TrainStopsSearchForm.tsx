import { useState, type FormEvent } from 'react'
import { useStations } from '../hooks/useStations'
import { StationAutocomplete } from './StationAutocomplete'

export interface TrainStopsSearchValues {
  trainNumber: string
  origin: string
  travelDate: string
}

interface TrainStopsSearchFormProps {
  onSubmit: (values: TrainStopsSearchValues) => void
  isLoading: boolean
  initialTrainNumber?: string
  initialOrigin?: string
  initialTravelDate?: string
}

export function TrainStopsSearchForm({ 
    onSubmit, 
    isLoading,
    initialTrainNumber = '',
    initialOrigin = '',
    initialTravelDate='',
}: TrainStopsSearchFormProps) {
  const [trainNumber, setTrainNumber] = useState(initialTrainNumber)
  const [origin, setOrigin] = useState(initialOrigin)
  const [travelDate, setTravelDate] = useState(initialTravelDate)
  const { stations } = useStations()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ trainNumber, origin, travelDate })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
      <label className="flex flex-col gap-1 text-sm">
        Train number
        <input
          type="text"
          value={trainNumber}
          onChange={(e) => setTrainNumber(e.target.value)}
          required
          className="bg-panel border border-line rounded-md px-3 py-2 text-primary"
        />
      </label>

      <StationAutocomplete
        label="Origin"
        value={origin}
        onChange={setOrigin}
        options={stations}
      />

      <label className="flex flex-col gap-1 text-sm">
        Travel date
        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
          required
          className="bg-panel border border-line rounded-md px-3 py-2 text-primary"
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="col-span-2 bg-accent text-white rounded-md py-2 font-medium disabled:opacity-50"
      >
        {isLoading ? 'Loading…' : 'Get stops'}
      </button>
    </form>
  )
}