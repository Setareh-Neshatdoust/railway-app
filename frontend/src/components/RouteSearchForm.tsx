import { useState, type FormEvent } from 'react'
import { useStations } from '../hooks/useStations'
import { StationAutocomplete } from './StationAutocomplete'
import { useDestinations } from '../hooks/useDestinations'
import { ItalianDateInput } from './ItalianDateInput'
import { DirectTrainNotice } from './DirectTrainNotice'

// relation: trains that start at the origin and end at the destination (TrainStats "Cerca relazione")
// stops: every train that stops at both stations, in this order (TrainStats "Cerca per fermate")
export type SearchMode = 'relation' | 'stops'

export interface RouteSearchValues {
  origin: string
  destination: string
  startDate: string
  endDate: string
  includeStations: boolean
  mode: SearchMode
}

interface RouteSearchFormProps {
  onSubmit: (values: RouteSearchValues) => void
  isLoading: boolean
  initialValues?: RouteSearchValues | null
}

const MODES: { value: SearchMode; title: string; description: string }[] = [
  { value: 'relation', title: 'Route', description: 'Trains that start at the origin and end at the destination' },
  { value: 'stops', title: 'Any two stops', description: 'Every train that stops at both stations, also intermediate ones' },
]

export function RouteSearchForm({ onSubmit, isLoading, initialValues }: RouteSearchFormProps) {
  const [mode, setMode] = useState<SearchMode>(initialValues?.mode ?? 'relation')
  const [origin, setOrigin] = useState(initialValues?.origin ?? '')
  const [destination, setDestination] = useState(initialValues?.destination?? '')
  const [startDate, setStartDate] = useState(initialValues?.startDate?? '')
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? '')
  const [includeStations, setIncludeStations] = useState(initialValues?.includeStations?? false)
  const { stations } = useStations()

  //Destination will be only loaded once the origin is selected
  const validOrigin = stations.includes(origin) ? origin : ''
    const{destinations, error:destinationsError,isLoading: destinationsLoading} = useDestinations(mode === 'relation' ? validOrigin : '')

  // Route: only the destinations TrainStats recorded for the origin. Any two stops: every station
  const destinationOptions = mode === 'relation' ? destinations : stations
  
  // The direct-train check runs only for a destination picked from the list
  const validDestination = destinationOptions.includes(destination) ? destination : ''

  //Clearing previous destination when the origin is changed
  function handleOriginChange (value : string){
    setOrigin(value)
    setDestination('')
  }

    // A destination chosen among all stations may not be a recorded route: clear it when going back to Route
  function handleModeChange(value: SearchMode) {
    setMode(value)
    if (value === 'relation') setDestination('')
  }

  let destinationHint:string
  if(!origin)destinationHint='Choose an origin first'
  else if(mode === 'stops')destinationHint=`Any station: every train that stopped at ${validOrigin || origin} and then here.`
  else if(destinationsLoading)destinationHint='Loading destinations...'
  else if(destinationsError)destinationHint=destinationsError
  else destinationHint = `${destinations.length} destinations with recorded trains from ${validOrigin}.`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ origin, destination, startDate, endDate, includeStations: mode === 'relation' && includeStations, mode })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div role="radiogroup" aria-label="What to search" className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={mode === option.value}
            onClick={() => handleModeChange(option.value)}
            className={`rounded-md border px-3 py-2 text-left ${mode === option.value ? 'border-accent bg-page' : 'border-line hover:border-accent'}`}
          >
            <span className={`block text-sm font-medium ${mode === option.value ? 'text-accent' : 'text-primary'}`}>{option.title}</span>
            <span className="block text-xs text-muted">{option.description}</span>
          </button>
        ))}
      </div>
      <StationAutocomplete
        label="Origin"
        value={origin}
        onChange={handleOriginChange}
        options={stations}
      />

      <StationAutocomplete
        label="Destination"
        value={destination}
        onChange={setDestination}
        options={destinationOptions}
        disabled={!validOrigin || (mode === 'relation' && (destinationsLoading || destinations.length === 0))}
        hint={destinationHint}
      />
      {mode === 'relation' && (
        <div className="sm:col-span-2 empty:hidden">
          <DirectTrainNotice origin={validOrigin} destination={validDestination} startDate={startDate} endDate={endDate} />
        </div>
      )}

      <ItalianDateInput
        label="Start date"
        value={startDate}
        onChange={setStartDate}
        required
      />

      <ItalianDateInput
        label="End date"
        value={endDate}
        onChange={setEndDate}
        min={startDate}
        required
      />
      
      {mode === 'relation' && (
        <label className="sm:col-span-2 flex items-center gap-2 text-sm">
          <input
          type='checkbox'
          checked= {includeStations}
          onChange={(e)=>setIncludeStations(e.target.checked)}/>
          Include intermediate stations
        </label>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="sm:col-span-2 bg-accent text-white rounded-md py-2 font-medium disabled:opacity-50"
      >
        {isLoading ? 'Loading…' : 'Get stats'}
      </button>
    </form>
  )
}