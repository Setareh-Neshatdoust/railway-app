import type { StationStats } from "../api/types";
import { formatValue, getDelayColor, getPercentageColor } from "../utils/format";

function StationRow({station}:{station: StationStats}){
    return(
        <tr className="borde-t border-line">
            <td className="px-3 py-2">{station.station}</td>
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

export function StationTable({stations}:{stations: StationStats[]}){
    return(
        <div className="border border-line rounded-md overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-panel text-left text-xs text-muted">
                        <th className="px-3 py-2 font-medium">Station</th>
                        <th className="px-3 py-2 font-medium text-right">Data</th>
                        <th className="px-3 py-2 font-medium text-right">Arrival_Delay</th>
                        <th className="px-3 py-2 font-medium text-right">Departure_Delay</th>
                        <th className="px-3 py-2 font-medium text-right">On-Time</th>
                    </tr>
                </thead>
                <tbody>
                    {stations.map((station)=>(
                        <StationRow key = {`${station.stop_number}-${station.station}`} station={station}/>
                    ))}
                </tbody>
            </table>
        </div>
    )
}