import { Link } from "react-router-dom";
import type { StationStats } from "../api/types";
import { useCollapsibleList } from "../hooks/useCollapsibleList";
import { formatValue, getDelayColor, getPercentageColor } from "../utils/format";
import { ShowMoreButton } from "./ShowMoreButton";

interface StationTableProps {
    stations: StationStats[]
    linkFor?: (station: string) => string
    threshold: number
}

// A short note only when a station is special; normal stations get nothing.
// mostRuns = the trips at the station seen most often, i.e. the trips of the whole period
// cancelledEverywhere = trips cancelled at every station: said once above the table, not on each row
function stationNote(station: StationStats, mostRuns: number, cancelledEverywhere: number): string | null {
    const trips = station.days_checked
    const ran = trips - station.cancelled_count   // trips that were not cancelled at this station
    const isStart = station.no_arrival_count === trips
    const isEnd = station.no_departure_count === trips
    const arrivalMissing = !isStart && ran > 0 && station.not_recorded_count === ran
    const departureMissing = !isEnd && ran > 0 && station.not_recorded_departure_count === ran

    const notes: string[] = []
    if (isStart) notes.push('Departure station')
    if (isEnd) notes.push('Final stop')
    if (trips < mostRuns) notes.push(`Stopped on ${trips} of ${mostRuns} trips`)
    const cancelledHere = station.cancelled_count - cancelledEverywhere
    if (cancelledHere > 0) notes.push(`Cancelled here on ${cancelledHere} ${cancelledHere === 1 ? 'trip' : 'trips'}`)
    if (arrivalMissing && departureMissing) {
        notes.push('Not recorded (n.d.)')
    } else if (arrivalMissing) {
        notes.push('Arrival not recorded (n.d.)')
    } else if (departureMissing) {
        notes.push('Departure not recorded (n.d.)')
    }
    if (!isStart && !arrivalMissing) {
        const missing = ran - station.days_with_data
        if (missing > 0) notes.push(`${missing} ${missing === 1 ? 'trip' : 'trips'} without data`)
    }
    return notes.length > 0 ? notes.join(' · ') : null
}

function StationRow({station, link, note}:{station: StationStats, link?: string, note: string | null}){
    return(
        <tr className="border-t border-line">
            <td className="px-3 py-2">
                {link ? (
                    <Link to={link} className="text-accent hover:underline">{station.station}</Link>
                ) : (
                    station.station
                )}
            </td>
            <td className={`px-3 py-2 font-mono text-right ${getDelayColor(station.avg_arrival_delay_min)}`}>
                {formatValue(station.avg_arrival_delay_min,'m')}
            </td>
            <td className={`px-3 py-2 font-mono text-right ${getDelayColor(station.avg_departure_delay_min)}`}>
                {formatValue(station.avg_departure_delay_min,'m')}
            </td>
            <td className={`px-3 py-2 font-mono text-right ${getPercentageColor(station.on_time_percentage)}`}>
                {formatValue(station.on_time_percentage,'%')}
            </td>
            <td className="px-3 py-2 text-xs text-muted">
                {note}
            </td>
        </tr>
    )
}

export function StationTable({stations, linkFor, threshold}: StationTableProps){
    const list = useCollapsibleList(stations, 10)

    if (stations.length === 0) {
        return (
            <p className="border border-line rounded-md px-4 py-3 text-sm text-muted">
                No stop data was recorded for these trains in this period.
            </p>
        )
    }

    const mostRuns = Math.max(...stations.map((station) => station.days_checked))
    const cancelledEverywhere = Math.min(...stations.map((station) => station.cancelled_count))

    return(
        <>
        {cancelledEverywhere > 0 && (
            <p className="mb-2 text-sm text-signal-bad">
                {cancelledEverywhere} {cancelledEverywhere === 1 ? 'trip was' : 'trips were'} cancelled in this period
                <span className="text-muted"></span>
            </p>
        )}
        <div className="border border-line rounded-md overflow-hidden">

            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-panel text-left text-xs text-muted">
                        <th className="px-3 py-2 font-medium">Station</th>
                        <th className="px-3 py-2 font-medium text-right">Avg Arrival delay</th>
                        <th className="px-3 py-2 font-medium text-right">Avg Departure delay</th>
                        <th className="px-3 py-2 font-medium text-right">On-time rate (≤ {threshold} min)</th>
                        <th className="px-3 py-2 font-medium">Note</th>
                    </tr>
                </thead>
                <tbody>
                    {list.visibleItems.map((station, index)=>(
                        <StationRow
                            key = {`${station.stop_number}-${station.station}`}
                            station={station}
                            link={index === 0 || !linkFor ? undefined : linkFor(station.station)}
                            note={stationNote(station, mostRuns, cancelledEverywhere)}
                        />
                    ))}
                </tbody>
            </table>
            {list.canToggle && (
                <ShowMoreButton expanded={list.expanded} hiddenCount={list.hiddenCount} onToggle={list.toggle} />
            )}
        </div>
        </>
    )
}