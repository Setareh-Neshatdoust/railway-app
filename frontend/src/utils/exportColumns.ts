import type { StationStats, TrainStats, TrainStop, SegmentTrainStats } from '../api/types'
import type { CsvColumn } from './exports'

// Which columns each downloaded table has, in which order, with which headers

export const TRAIN_COLUMNS: CsvColumn<TrainStats>[] = [
  { label: 'Train number', value: (t) => t.train_number },
  { label: 'Category', value: (t) => t.category },
  { label: 'Records', value: (t) => t.total_records },
  { label: 'Cancelled', value: (t) => t.cancelled_count },
  { label: 'Cancellation rate %', value: (t) => t.cancellation_rate_pct },
  { label: 'Avg departure delay (min)', value: (t) => t.avg_departure_delay_min },
  { label: 'Avg arrival delay (min)', value: (t) => t.avg_arrival_delay_min },
  { label: 'On-time %', value: (t) => t.on_time_percentage },
]

export const SEGMENT_TRAIN_COLUMNS: CsvColumn<SegmentTrainStats>[] = [
  { label: 'Train number', value: (t) => t.train_number },
  { label: 'Category', value: (t) => t.category },
  { label: 'Train from', value: (t) => t.train_origin },
  { label: 'Train to', value: (t) => t.train_destination },
  { label: 'Records', value: (t) => t.total_records },
  { label: 'Cancelled', value: (t) => t.cancelled_count },
  { label: 'Cancellation rate %', value: (t) => t.cancellation_rate_pct },
  { label: 'Avg departure delay (min)', value: (t) => t.avg_departure_delay_min },
  { label: 'Avg arrival delay (min)', value: (t) => t.avg_arrival_delay_min },
  { label: 'On-time %', value: (t) => t.on_time_percentage },
]

export const STATION_COLUMNS: CsvColumn<StationStats>[] = [
  { label: 'Stop number', value: (s) => s.stop_number },
  { label: 'Station', value: (s) => s.station },
  { label: 'Days checked', value: (s) => s.days_checked },
  { label: 'Days with data', value: (s) => s.days_with_data },
  { label: 'Avg arrival delay (min)', value: (s) => s.avg_arrival_delay_min },
  { label: 'Avg departure delay (min)', value: (s) => s.avg_departure_delay_min },
  { label: 'On-time %', value: (s) => s.on_time_percentage },
  { label: 'Runs checked', value: (s) => s.days_checked },
  { label: 'Runs with recorded delay', value: (s) => s.days_with_data },
]

export const STOP_COLUMNS: CsvColumn<TrainStop>[] = [
  { label: 'Stop number', value: (s) => s.stop_number },
  { label: 'Station', value: (s) => s.station },
  { label: 'Platform scheduled', value: (s) => s.platform_scheduled },
  { label: 'Platform actual', value: (s) => s.platform_actual },
  { label: 'Arrival scheduled', value: (s) => s.arrival_scheduled },
  { label: 'Arrival actual', value: (s) => s.arrival_actual },
  { label: 'Arrival delay', value: (s) => s.arrival_delay },
  { label: 'Departure scheduled', value: (s) => s.departure_scheduled },
  { label: 'Departure actual', value: (s) => s.departure_actual },
  { label: 'Departure delay', value: (s) => s.departure_delay },
]
