import { Routes, Route } from 'react-router-dom'
import { RouteStatsPage } from '../pages/RouteStatsPage'
import { StationAnalysisPage } from '../pages/StationAnalysisPage'
import { TrainStopsPage } from '../pages/TrainStopsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RouteStatsPage />} />
      <Route path="/stations" element={<StationAnalysisPage />} />
      <Route path="/stops" element={<TrainStopsPage />} />
    </Routes>
  )
}