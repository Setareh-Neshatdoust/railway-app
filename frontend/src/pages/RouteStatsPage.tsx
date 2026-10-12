
import { getRouteStats } from '../api/client'
import { RouteSearchForm, type RouteSearchValues } from '../components/RouteSearchForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { Link, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useApiRequest } from '../hooks/useApiRequest'
import { routeSearchFromUrl, routeSearchToUrl, trainAnalysisToUrl } from '../routes/searchParams'
import { formatValue, getPercentageColor } from '../utils/format'
import { StatsSummary } from '../components/StatsSummary'
import { StationTable } from '../components/StationTable'

export function RouteStatsPage() {

  const [searchParams,setSearchParams] = useSearchParams()
  const search = useMemo(()=>routeSearchFromUrl(searchParams),[searchParams])
  const {data: result, error, isLoading} = useApiRequest(search,getRouteStats)
  
  function handleSearch(values: RouteSearchValues) {
    setSearchParams(routeSearchToUrl(values))
}
return (
  <div className="p-6 max-w-3xl">
    <h2 className="text-base font-medium mb-4">Route statistics</h2>

     <RouteSearchForm
        key={searchParams.toString()}
        initialValues={search}
        onSubmit={handleSearch}
        isLoading={isLoading}
      />

   {error && <ErrorMessage message={error} />}

      {result && search && (
  <div>
     <StatsSummary summary={result.overall}/>
    <h3 className="text-sm text-muted mb-2">By train ({result.trains_analyzed} analyzed)</h3>
    <div className="border border-line rounded-md divide-y divide-line">
      {result.by_train.map((train) => (
        <div key={train.train_number} className="flex items-center px-4 py-2 text-sm">
          <Link
            to={`train?${new URLSearchParams(trainAnalysisToUrl({...search, trainNumber: train.train_number}))}`}
            className="flex-1 text-accent hover:underline"
           >
            {train.train_number} ({train.category})
           </Link>
          <span className="font-mono text-muted mr-4">{train.total_records} records</span>
          <span className={`font-mono ${getPercentageColor(train.on_time_percentage)}`}>
            {formatValue(train.on_time_percentage, '%')}
          </span>
        </div>
      ))}
    </div>
    {search.includeStations && (
      <>
      <h3 className="text-sm text-muted mb-2"> By Station (all trains)</h3>
      <StationTable stations={result.by_station}/>
        </>
    )}
  </div>
)}
  </div>
)
}
