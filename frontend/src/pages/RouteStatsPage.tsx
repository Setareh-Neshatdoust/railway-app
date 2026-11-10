import { getRouteStats, getSegmentStats } from '../api/client'
import { RouteSearchForm, type RouteSearchValues } from '../components/RouteSearchForm'
import { AlertModal } from '../components/AlertModal'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useMemo, useCallback, useState } from 'react'
import { useApiRequest } from '../hooks/useApiRequest'
import { routeSearchFromUrl, routeSearchToUrl, trainAnalysisToUrl, segmentSearchToUrl, pageUrl } from '../routes/searchParams'
import { formatValue, getPercentageColor} from '../utils/format'
import { StatsSummary } from '../components/StatsSummary'
import { StationTable } from '../components/StationTable'
import { DownloadButton } from '../components/DownloadButton'
import { downloadCsv, downloadJson, makeFileName } from '../utils/exports'
import { STATION_COLUMNS, TRAIN_COLUMNS, SEGMENT_TRAIN_COLUMNS } from '../utils/exportColumns'
import { SegmentResult } from '../components/SegmentResult'
import { formatItalianDate } from '../utils/dates'
import { useCollapsibleList } from '../hooks/useCollapsibleList'
import { ShowMoreButton } from '../components/ShowMoreButton'
import { Section } from '../components/Section'
import { ChartSlot } from '../components/ChartSlot'
import { PageNav } from '../components/PageNav'
import { CategoryBadge, CategoryLegend } from '../components/CategoryBadge'
import { DirectTrainNotice } from '../components/DirectTrainNotice'
import { InfoTip } from '../components/InfoTip'
import { SourceGapsNotice } from '../components/SourceGapsNotice'
import { OnTimeByTrainChart } from '../components/OnTimeByTrainChart'
import { DelayByDayChart } from '../components/DelayByDayChart'

export function RouteStatsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const here = location.pathname + location.search
  const search = useMemo(() => routeSearchFromUrl(searchParams), [searchParams])
  // One search, two kinds of analysis: only the one chosen in the form is requested (the other gets null)
  const relationSearch = useMemo(() => (search?.mode === 'relation' ? search : null), [search])
  const stopsSearch = useMemo(() => (search?.mode === 'stops' ? search : null), [search])
  const relation = useApiRequest(relationSearch, getRouteStats)
  const stops = useApiRequest(stopsSearch, getSegmentStats)
  const result = relation.data
  const stopsResult = stops.data
  const error = relation.error ?? stops.error
  const isLoading = relation.isLoading || stops.isLoading

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

      <section className="bg-panel border border-line rounded-lg p-5">
        <RouteSearchForm
          key={searchParams.toString()}
          initialValues={search}
          onSubmit={handleSearch}
          isLoading={isLoading}
        />
      </section>

      {error && closedErrorFor !== searchKey && (
        <AlertModal message={error} onClose={closeError} />
      )}

            {stopsResult && search && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">{stopsResult.origin} → {stopsResult.destination}</h3>
              <p className="text-sm text-muted">
                {period} · every train that stopped at {stopsResult.origin} and then at {stopsResult.destination}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DownloadButton
                label="Trains (CSV)"
                onClick={() => downloadCsv(`${baseName}_stops_trains.csv`, stopsResult.by_train, SEGMENT_TRAIN_COLUMNS)}
              />
              <DownloadButton
                label="All (JSON)"
                onClick={() => downloadJson(`${baseName}_stops.json`, {
                  source: 'TrainStats (trainstats.altervista.org)',
                  generated_at: new Date().toISOString(),
                  ...stopsResult,
                })}
              />
            </div>
          </div>
          <SourceGapsNotice days={stopsResult.days_without_answer} />
          <SegmentResult
            data={stopsResult}
            period={period}
            linkFor={(train) => pageUrl('/train', trainAnalysisToUrl({
              trainNumber: train.train_number,
              origin: train.train_origin,
              destination: train.train_destination,
              startDate: search.startDate,
              endDate: search.endDate,
            }), here)}
          />
        </>
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
          
          <SourceGapsNotice trains={result.trains_without_answer} stopTables={result.stop_tables_without_answer} />
          <DirectTrainNotice origin={search.origin} destination={search.destination} startDate={search.startDate} endDate={search.endDate} />
          <PageNav items={[
            { id: 'summary', label: 'Summary' },
            { id: 'over-time', label: 'Over time' },
            { id: 'by-train', label: 'By train' },
            ...(search.includeStations ? [{ id: 'by-station', label: 'By station' }] : []),
          ]} />

          <StatsSummary summary={result.overall} period={period} />

          <Section id="over-time" title="Over time">
            <DelayByDayChart days={result.by_day} threshold={result.overall.on_time_threshold_minutes} />
          </Section>

          <Section
            id="by-train"
            title={`By train (${result.by_train.length})`}
            description="Trains with recorded data in this period. Click a train to see its stops."
          >
            <OnTimeByTrainChart
              trains={result.by_train}
              linkFor={(train) => pageUrl('/train', trainAnalysisToUrl({ ...search, trainNumber: train.train_number }), here)}
            />
            <div className="mb-3"><CategoryLegend /></div>
            <div className="border border-line rounded-md divide-y divide-line">
              <div className="flex items-center gap-3 bg-panel px-4 py-2 text-xs font-medium text-muted">
                <span className="flex-1">Train</span>
                <span className="w-28 text-center">
                  Trips
                  <InfoTip
                    align="right"
                    text={`Days on which the train ran the whole way from ${search.origin} to ${search.destination}, cancelled trips included. On days it started or ended at another station it is not counted here, so it can have fewer trips than in “By stops”.`}
                  />
                </span>
                <span className="w-28 text-center">On time (≤ {result.overall.on_time_threshold_minutes} min)</span>
              </div>
              {trains.visibleItems.map((train) => (
                <div key={train.train_number} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <CategoryBadge category={train.category} />
                  <Link
                    to={pageUrl('/train', trainAnalysisToUrl({ ...search, trainNumber: train.train_number }), here)}
                    className="flex-1 text-accent hover:underline"
                  >
                    {train.train_number}
                  </Link>
                  <span className="w-28 text-center font-mono text-muted">
                    {train.total_records}
                    {train.cancelled_count > 0 && (
                      <span className="block font-sans text-xs text-signal-bad">{train.cancelled_count} cancelled</span>
                    )}
                  </span>
                  <span
                    className={`w-28 text-center font-mono ${getPercentageColor(train.on_time_percentage)}`}
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