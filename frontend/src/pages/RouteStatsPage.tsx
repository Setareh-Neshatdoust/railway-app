
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
import { DownloadButton } from '../components/DownloadButton'
import { downloadCsv, downloadJson, makeFileName } from '../utils/exports'
import { STATION_COLUMNS, TRAIN_COLUMNS } from '../utils/exportColumns'

export function RouteStatsPage() {

  const [searchParams,setSearchParams] = useSearchParams()
  const search = useMemo(()=>routeSearchFromUrl(searchParams),[searchParams])
  const {data: result, error, isLoading} = useApiRequest(search,getRouteStats)
  const baseName = 
  search ? makeFileName(['route', search.origin, search.destination, search.startDate, search.endDate])
    : ''
  
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
        <div className="flex gap-2 mb-4">
      <DownloadButton
        label="Trains (CSV)"
        onClick={() => downloadCsv(`${baseName}_trains.csv`, result.by_train, TRAIN_COLUMNS)}
      />
      {search.includeStations && (
        <DownloadButton
          label="Stations (CSV)"
          onClick={() => downloadCsv(`${baseName}_stations.csv`, result.by_station, STATION_COLUMNS)}
        />
      )}
      <DownloadButton
        label="All (JSON)"
        onClick={() => downloadJson(`${baseName}.json`, {
          source: 'TrainStats (trainstats.altervista.org)',
          generated_at: new Date().toISOString(),
          ...result,
        })}
      />
    </div>
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
