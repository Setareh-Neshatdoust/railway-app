
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
  by_day: DayStats[]
}

// One day of the period: the same indicators as the summary, for that day only
export interface DayStats extends RouteStatsSummary {
  date: string      
  notes: string[]   // what TrainStats wrote that day, e.g. "Soppresso", "Treno cancellato da BRA"
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

/// Is the route still served, and do trains pass through both stations? (GET /route/direct-train)
export type RelationStatus = 'active' | 'occasional' | 'special_only' | 'inactive' | 'empty'

export interface DirectTrainResponse {
  origin: string
  destination: string
  relation: RelationStatus
  last_seen: string | null         // last train of the route, ISO date "YYYY-MM-DD"
  count: number                    // how many times those trains were recorded
  through_last_seen: string | null // last train passing through both stations (only when the route is not active)
}