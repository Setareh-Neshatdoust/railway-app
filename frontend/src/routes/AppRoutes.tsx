import { Routes, Route } from 'react-router-dom'
import { RouteStatsPage } from '../pages/RouteStatsPage'
import { StationAnalysisPage } from '../pages/StationAnalysisPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RouteStatsPage />} />
      <Route path="/stations" element={<StationAnalysisPage />} />
    </Routes>
  )
}