
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