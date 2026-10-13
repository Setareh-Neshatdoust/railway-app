
import type { RouteStatsResponse , TrainStopsResponse, SegmentStatsResponse} from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const responseCache = new Map<string,Promise<unknown>>()

function fetchJasonCahched <T>(url: string): Promise<T> {
  const cached = responseCache.get(url)
  if (cached) return cached as Promise<T>

  const request = fetch(url). then (async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const message = body?.detail?? `Request failed with status ${response.status}`
      throw new ApiError(response.status,message)
    }
    return response.json() as Promise<T>
  })

responseCache.set(url, request)
request.catch(()=> responseCache.delete(url))
return request
}

export interface RouteStatsParams {
  origin: string
  destination: string
  startDate: string
  endDate: string
  trainNumber?: string
  onTimeThresholdMinutes?: number
  includeStations?: boolean
}

export async function getRouteStats(params: RouteStatsParams): Promise<RouteStatsResponse> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    start_date: params.startDate,
    end_date: params.endDate,
  })

  if (params.trainNumber) query.set('train_number', params.trainNumber)
  if (params.onTimeThresholdMinutes !== undefined) {
    query.set('on_time_threshold_minutes', String(params.onTimeThresholdMinutes))
  }
  if (params.includeStations) query.set('include_stations', 'true')
    return fetchJasonCahched<RouteStatsResponse>(`${BASE_URL}/route/stats?${query.toString()}`)

}

export interface SegmentStatsParams {
  origin: string
  destination: string
  startDate: string
  endDate: string
}

export async function getSegmentStats(params: SegmentStatsParams): Promise<SegmentStatsResponse> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    start_date: params.startDate,
    end_date: params.endDate,
  })
  return fetchJasonCahched<SegmentStatsResponse>(`${BASE_URL}/route/segment?${query.toString()}`)
}

export async function getStations(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/stations`)
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to load station list.')
  }
  const data = await response.json()
  return data.stations
}

//Getting the defined destination for the specific origin
export async function getDestinations(origin : string) : Promise <string[]> {
  const query = new URLSearchParams({origin})
  const response = await fetch(`${BASE_URL}/stations/destinations?${query.toString()}`)

  if(!response.ok){
    const body = await response.json().catch(()=>null)
    const message = body?.detail ?? `Request failed with status ${response.status}`
    throw new ApiError(response.status,message)
  }

  const data = await response.json()
  return data.destinations
  
}

function toTrainStatsDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}_${month}_${year}`
}

export interface TrainStopsParams {
  trainNumber: string
  origin: string
  travelDate: string
}

export async function getTrainStops(params: TrainStopsParams): Promise<TrainStopsResponse> {
  const query = new URLSearchParams({
    train_number: params.trainNumber,
    origin: params.origin,
    travel_date: toTrainStatsDate(params.travelDate),
  })
  return fetchJasonCahched<TrainStopsResponse>(`${BASE_URL}/train/stops?${query.toString()}`)

}