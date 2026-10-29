
export interface RouteStatsSummary {
  total_records: number
  cancelled_count: number
  cancellation_rate_pct: number | null
  avg_departure_delay_min: number | null
  avg_arrival_delay_min: number | null
  on_time_percentage: number | null
  on_time_threshold_minutes: number
}

export interface TrainStats extends RouteStatsSummary {
  train_number: string
  category: string
}

export interface StationStats {
  station: string
  stop_number: string | null
  days_checked: number
  days_with_data: number
  avg_arrival_delay_min: number | null
  avg_departure_delay_min: number | null
  on_time_percentage: number | null
}

export interface RouteStatsResponse {
  origin: string
  destination: string
  start_date: string
  end_date: string
  trains_analyzed: number
  overall: RouteStatsSummary
  by_train: TrainStats[]
  by_station: StationStats[]
}

export interface TrainStop {
  stop_number: string
  station: string
  platform_scheduled: string | null
  platform_actual: string| null
  arrival_scheduled: string
  arrival_actual: string
  arrival_delay: string
  departure_scheduled: string
  departure_actual: string
  departure_delay: string
}

export interface TrainStopsResponse {
  train_number: string
  date: string
  origin: string
  total_stops: number
  stops: TrainStop[]
}


export interface SegmentTrainStats extends TrainStats {
  train_origin: string
  train_destination: string
}

export interface SegmentStatsResponse {
  origin: string
  destination: string
  start_date: string
  end_date: string
  overall: RouteStatsSummary
  by_train: SegmentTrainStats[]
}

// Does a direct train run between two stations? (GET /route/direct-train)
export type DirectTrainStatus = 'active' | 'special_only' | 'no_direct_train' | 'no_trains'

export interface DirectTrainResponse {
  origin: string
  destination: string
  status: DirectTrainStatus
  last_seen: string | null // ISO date "YYYY-MM-DD", or null when unknown
}