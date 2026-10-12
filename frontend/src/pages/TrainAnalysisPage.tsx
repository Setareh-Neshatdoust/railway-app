import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getRouteStats } from "../api/client";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatsSummary } from "../components/StatsSummary";
import { StationTable } from "../components/StationTable";
import { useApiRequest } from "../hooks/useApiRequest";
import { trainAnalysisFromUrl, trainStopsSearchToUrl } from "../routes/searchParams";
import { DownloadButton } from "../components/DownloadButton";
import { downloadCsv,downloadJson, makeFileName } from "../utils/exports";
import { STATION_COLUMNS } from "../utils/exportColumns";

export function TrainAnalysisPage (){
    const [searchParams] = useSearchParams()
    const train = useMemo(()=> trainAnalysisFromUrl(searchParams), [searchParams])
    const params = useMemo(()=> (train?{... train, includeStations:true}: null), [train],)
    const {data : result , error, isLoading} = useApiRequest(params, getRouteStats)
    const [dayToOpen, setDayToOpen] = useState(train?.startDate ?? '')

    if(!train){
        return (
            <div className="p-6 max-w-3xl">
                <ErrorMessage message="No train selected!"></ErrorMessage>
            </div>
        )
    }
        const baseName = makeFileName(['train', train.trainNumber, train.origin, train.destination, train.startDate, train.endDate])
    return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-base font-medium mb-1">Train {train.trainNumber}</h2>
      <p className="text-sm text-muted mb-4">
        {train.origin} → {train.destination}, {train.startDate} to {train.endDate}
      </p>

      {isLoading && <p className="text-sm text-muted">Loading… </p>}
      {error && <ErrorMessage message={error} />}

      {result && (
        <>
                  <div className="flex gap-2 mb-4">
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
          <StatsSummary summary={result.overall} />

          <h3 className="text-sm text-muted mb-2">At every stop on the path</h3>
          <div className="mb-6">
            <StationTable stations={result.by_station} />
          </div>
        </>
      )}

      <h3 className="text-sm text-muted mb-2">One day in detail (all stops, platforms)</h3>
      <div className="flex gap-3 items-center">
        <input
          type="date"
          value={dayToOpen}
          min={train.startDate}
          max={train.endDate}
          onChange={(e) => setDayToOpen(e.target.value)}
          className="bg-panel border border-line rounded-md px-3 py-2 text-primary text-sm"
        />
        {dayToOpen && (
          <Link
            to={`/stops?${new URLSearchParams(trainStopsSearchToUrl({ trainNumber: train.trainNumber, origin: train.origin, travelDate: dayToOpen }))}`}
            className="text-accent hover:underline text-sm"
          >
            Open this day
          </Link>
        )}
      </div>
    </div>
  )
}