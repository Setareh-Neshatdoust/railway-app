
import type { RouteStatsResponse } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
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

  const response = await fetch(`${BASE_URL}/route/stats?${query.toString()}`)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.detail ?? `Request failed with status ${response.status}`
    throw new ApiError(response.status, message)
  }

  return response.json()
}

export async function getStations(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/stations`)
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to load station list.')
  }
  const data = await response.json()
  return data.stations
}