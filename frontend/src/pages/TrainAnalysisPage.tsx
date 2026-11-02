import { useMemo } from "react";
import { getRouteStats } from "../api/client";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatsSummary } from "../components/StatsSummary";
import { StationTable } from "../components/StationTable";
import { useApiRequest } from "../hooks/useApiRequest";
import { pageUrl, trainAnalysisFromUrl, trainStopsSearchToUrl, backFromUrl } from "../routes/searchParams";
import { DownloadButton } from "../components/DownloadButton";
import { downloadCsv,downloadJson, makeFileName } from "../utils/exports";
import { STATION_COLUMNS } from "../utils/exportColumns";
import { DayByDayTable } from "../components/DayByDayTable";
import { formatItalianDate } from "../utils/dates";
import { BackLink } from "../components/BackLink";
import { Section } from "../components/Section";
import { ChartSlot } from "../components/ChartSlot";
import { PageNav } from "../components/PageNav";
import { AlertModal } from "../components/AlertModal";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export function TrainAnalysisPage (){
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const here = location.pathname + location.search
    const train = useMemo(()=> trainAnalysisFromUrl(searchParams), [searchParams])
    const params = useMemo(()=> (train?{... train, includeStations:true}: null), [train],)
    const {data : result , error, isLoading} = useApiRequest(params, getRouteStats)
    const navigate = useNavigate()

    if(!train){
        return (
            <ErrorMessage message="No train selected!"></ErrorMessage>
        )
    }
    const period = `${formatItalianDate(train.startDate)} – ${formatItalianDate(train.endDate)}`
    const baseName = makeFileName(['train', train.trainNumber, train.origin, train.destination, formatItalianDate(train.startDate), formatItalianDate(train.endDate)])

    return (
    <div className="space-y-6">
      <BackLink label="Back to route analysis" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">Train {train.trainNumber}</h2>
          <p className="text-sm text-muted mt-1">{train.origin} → {train.destination} · {period}</p>
        </div>
        {result && (
          <div className="flex flex-wrap gap-2">
            <DownloadButton
              label="Stops (CSV)"
              onClick={() => downloadCsv(`${baseName}_stops.csv`, result.by_station, STATION_COLUMNS)}
            />
            <DownloadButton
              label="All (JSON)"
              onClick={() => downloadJson(`${baseName}.json`, {
                source: 'TrainStats (trainstats.altervista.org)',
                generated_at: new Date().toISOString(),
                train_number: train.trainNumber,
                ...result,
              })}
            />
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted">Loading… </p>}
      {error && <AlertModal message={error} onClose={() => navigate(backFromUrl(searchParams))} />}

      {result && (
        <>
          <PageNav items={[
            { id: 'summary', label: 'Summary' },
            { id: 'over-time', label: 'Over time' },
            { id: 'stops', label: 'Stops' },
            { id: 'by-day', label: 'Day by day' },
          ]} />

          <StatsSummary summary={result.overall} period={period} runsOf={`train ${train.trainNumber}`} />

          <Section id="over-time" title="Over time">
            <ChartSlot
              title="Arrival delay of this train by day"
              shows="One point per day in the period, with the on-time limit drawn as a reference line."
            />
          </Section>

          <Section id="stops" title="At every stop on the path" description={`Averages over ${period}.`}>
            <ChartSlot
              title="Average delay along the stops"
              shows="Stops in travel order on the horizontal axis, average delay on the vertical axis."
            />
            <StationTable stations={result.by_station} threshold={result.overall.on_time_threshold_minutes} />
          </Section>
           <Section
            id="by-day"
            title="Day by day"
            description="Every day this train ran in the period, at its final station. Open a day to see all its stops and platforms."
            >
            <DayByDayTable
              days={result.by_day}
              threshold={result.overall.on_time_threshold_minutes}
              stopsLinkFor={(isoDate) => pageUrl('/stops', trainStopsSearchToUrl({ trainNumber: train.trainNumber, origin: train.origin, travelDate: isoDate }), here)}
            />
           </Section>
        </>
      )}
    </div>
  )
}