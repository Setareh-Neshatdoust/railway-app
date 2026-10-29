import { getRouteStats } from '../api/client'
import { RouteSearchForm, type RouteSearchValues } from '../components/RouteSearchForm'
import { AlertModal } from '../components/AlertModal'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useMemo, useCallback, useState } from 'react'
import { useApiRequest } from '../hooks/useApiRequest'
import { routeSearchFromUrl, routeSearchToUrl, trainAnalysisToUrl, segmentSearchToUrl, pageUrl } from '../routes/searchParams'
import { formatValue, getPercentageColor } from '../utils/format'
import { StatsSummary } from '../components/StatsSummary'
import { StationTable } from '../components/StationTable'
import { DownloadButton } from '../components/DownloadButton'
import { downloadCsv, downloadJson, makeFileName } from '../utils/exports'
import { STATION_COLUMNS, TRAIN_COLUMNS } from '../utils/exportColumns'
import { formatItalianDate } from '../utils/dates'
import { useCollapsibleList } from '../hooks/useCollapsibleList'
import { ShowMoreButton } from '../components/ShowMoreButton'
import { Section } from '../components/Section'
import { ChartSlot } from '../components/ChartSlot'
import { PageNav } from '../components/PageNav'
import { CategoryBadge, CategoryLegend } from '../components/CategoryBadge'
import { DirectTrainNotice } from '../components/DirectTrainNotice'

export function RouteStatsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const here = location.pathname + location.search
  const search = useMemo(() => routeSearchFromUrl(searchParams), [searchParams])
  const { data: result, error, isLoading } = useApiRequest(search, getRouteStats)
  const trains = useCollapsibleList(result?.by_train ?? [], 5)
  const period = search ? `${formatItalianDate(search.startDate)} – ${formatItalianDate(search.endDate)}` : ''
  const baseName =
    search ? makeFileName(['route', search.origin, search.destination, formatItalianDate(search.startDate), formatItalianDate(search.endDate)])
      : ''

  // The search whose error the user has closed: its message is not shown again
  const [closedErrorFor, setClosedErrorFor] = useState<string | null>(null)
  const searchKey = searchParams.toString()
  const closeError = useCallback(() => setClosedErrorFor(searchKey), [searchKey])

    function handleSearch(values: RouteSearchValues) {
    const params = routeSearchToUrl(values)
    if (new URLSearchParams(params).toString() === searchKey) setClosedErrorFor(null)
    setSearchParams(params)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium">Route analysis</h2>
        <p className="text-sm text-muted mt-1">Punctuality of every train between two stations over a period.</p>
      </div>

      <Section title="Search">
        <RouteSearchForm
          key={searchParams.toString()}
          initialValues={search}
          onSubmit={handleSearch}
          isLoading={isLoading}
        />
      </Section>

      {error && closedErrorFor !== searchKey && (
        <AlertModal message={error} onClose={closeError} />
      )}

      {result && search && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">{search.origin} → {search.destination}</h3>
              <p className="text-sm text-muted">{period}</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
          </div>

          <DirectTrainNotice origin={search.origin} destination={search.destination} />

          <PageNav items={[
            { id: 'summary', label: 'Summary' },
            { id: 'over-time', label: 'Over time' },
            { id: 'by-train', label: 'By train' },
            ...(search.includeStations ? [{ id: 'by-station', label: 'By station' }] : []),
          ]} />

          <StatsSummary summary={result.overall} period={period} />

          <Section id="over-time" title="Over time">
            <ChartSlot
              title="Average arrival delay by day"
              shows="One point per day in the period, so trends and bad days stand out."
            />
          </Section>

          <Section
            id="by-train"
            title={`By train (${result.by_train.length})`}
            description="Trains with recorded data in this period. Click a train to see its stops."
          >
            <ChartSlot
              title="On-time rate by train"
              shows="One bar per train, sorted from best to worst, on a common scale from 0 to 100%."
            />
            <div className="mb-3"><CategoryLegend /></div>
            <div className="border border-line rounded-md divide-y divide-line">
              {trains.visibleItems.map((train) => (
                <div key={train.train_number} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <CategoryBadge category={train.category} />
                  <Link
                    to={pageUrl('/train', trainAnalysisToUrl({ ...search, trainNumber: train.train_number }), here)}
                    className="flex-1 text-accent hover:underline"
                  >
                    {train.train_number}
                  </Link>
                  <span className="font-mono text-muted mr-4" title="Days on which this train has recorded data">
                    {train.total_records} days
                  </span>
                  <span
                    className={`font-mono ${getPercentageColor(train.on_time_percentage)}`}
                    title={`On-time rate: arrived at most ${train.on_time_threshold_minutes} min late`}
                  >
                    {formatValue(train.on_time_percentage, '%')}
                  </span>
                </div>
              ))}
              {trains.canToggle && (
                <ShowMoreButton expanded={trains.expanded} hiddenCount={trains.hiddenCount} onToggle={trains.toggle} />
              )}
            </div>
          </Section>

          {search.includeStations && (
            <Section
              id="by-station"
              title="By station (all trains)"
              description={`Averages over ${period}. Click a station to open ${search.origin} → that station.`}
            >
              <ChartSlot
                title="Average delay along the route"
                shows="Stations in travel order on the horizontal axis, average delay on the vertical axis, to see where delay builds up."
              />
              <StationTable
                stations={result.by_station}
                threshold={result.overall.on_time_threshold_minutes}
                linkFor={(station) => pageUrl('/segment', segmentSearchToUrl({ ...search, destination: station }), here)}
              />
            </Section>
          )}
        </>
      )}
    </div>
  )
}