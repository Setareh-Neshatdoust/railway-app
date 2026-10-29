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

function StationRow({station, link}:{station: StationStats, link?: string}){
    return(
        <tr className="border-t border-line">
            <td className="px-3 py-2">
                {link ? (
                    <Link to={link} className="text-accent hover:underline">{station.station}</Link>
                ) : (
                    station.station
                )}
            </td>
            <td className="px-3 py-2 font-mono text-muted text-right">
                {station.days_with_data}/{station.days_checked}
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
    
    return(
        <div className="border border-line rounded-md overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-panel text-left text-xs text-muted">
                        <th className="px-3 py-2 font-medium">Station</th>
                            <th
                            className="px-3 py-2 font-medium text-right"
                            title="Train runs with a recorded delay at this station / train runs checked"
                            >
                            Trains recorded
                        </th>
                        <th className="px-3 py-2 font-medium text-right">Avg Arrival delay</th>
                        <th className="px-3 py-2 font-medium text-right">Avg Departure delay</th>
                        <th className="px-3 py-2 font-medium text-right">On-time rate (≤ {threshold} min)</th>
                    </tr>
                </thead>
                <tbody>
                    {list.visibleItems.map((station, index)=>(
                        <StationRow
                            key = {`${station.stop_number}-${station.station}`}
                            station={station}
                            link={index === 0 || !linkFor ? undefined : linkFor(station.station)}
                        />
                    ))}
                </tbody>
            </table>
            {list.canToggle && (
                <ShowMoreButton expanded={list.expanded} hiddenCount={list.hiddenCount} onToggle={list.toggle} />
            )}
        </div>
    )
}