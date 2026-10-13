import { Routes, Route } from 'react-router-dom'
import { RouteStatsPage } from '../pages/RouteStatsPage'
import { TrainAnalysisPage } from '../pages/TrainAnalysisPage'
import { TrainStopsPage } from '../pages/TrainStopsPage'
import { SegmentPage } from '../pages/SegmentPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RouteStatsPage />} />
      <Route path="/train" element={<TrainAnalysisPage/>} />
      <Route path="/stops" element={<TrainStopsPage />} />
      <Route path="/segment" element={<SegmentPage />} />
    </Routes>
  )
}