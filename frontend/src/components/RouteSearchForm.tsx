import { useState, type FormEvent } from 'react'
import { useStations } from '../hooks/useStations'
import { StationAutocomplete } from './StationAutocomplete'
import { useDestinations } from '../hooks/useDestinations'
import { ItalianDateInput } from './ItalianDateInput'
import { DirectTrainNotice } from './DirectTrainNotice'

export interface RouteSearchValues {
  origin: string
  destination: string
  startDate: string
  endDate: string
  includeStations: boolean
}

interface RouteSearchFormProps {
  onSubmit: (values: RouteSearchValues) => void
  isLoading: boolean
  initialValues?: RouteSearchValues | null
}

export function RouteSearchForm({ onSubmit, isLoading, initialValues }: RouteSearchFormProps) {
  const [origin, setOrigin] = useState(initialValues?.origin ?? '')
  const [destination, setDestination] = useState(initialValues?.destination?? '')
  const [startDate, setStartDate] = useState(initialValues?.startDate?? '')
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? '')
  const [includeStations, setIncludeStations] = useState(initialValues?.includeStations?? false)

  const { stations } = useStations()

  //Destination will be only loaded once the origin is selected
  const validOrigin = stations.includes(origin) ? origin : ''
  const{destinations, error:destinationsError,isLoading: destinationsLoading} = useDestinations(validOrigin)
  
  // The direct-train check runs only for a destination picked from the list
  const validDestination = destinations.includes(destination) ? destination : ''

  //Clearing previous destination when the origin is changed
  function handleOriginChange (value : string){
    setOrigin(value)
    setDestination('')
  }
  let destinationHint:string
  if(!origin)destinationHint='Choose an origin first'
  else if(destinationsLoading)destinationHint='Loading destinations...'
  else if(destinationsError)destinationHint=destinationsError
  else destinationHint = `${destinations.length} destinations with recorded trains from ${validOrigin}.`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ origin, destination, startDate, endDate, includeStations })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        options={destinations}
        disabled={!validOrigin || destinationsLoading || destinations.length === 0}
        hint={destinationHint}
      />
      <div className="sm:col-span-2 empty:hidden">
        <DirectTrainNotice origin={validOrigin} destination={validDestination} />
      </div>

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
      
      <label className="sm:col-span-2 flex items-center gap-2 text-sm">
        <input
        type='checkbox'
        checked= {includeStations}
        onChange={(e)=>setIncludeStations(e.target.checked)}/>
        Include intermediate stations (checks every train on every day)
      </label>

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