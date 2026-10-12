import type { RouteStatsSummary } from "../api/types";
import { formatValue, getCancellationColor, getDelayColor, getPercentageColor } from "../utils/format";

interface StatCardProps {
    label : string
    value : string
    colorClass :string
}

function StatCard ({label, value, colorClass} : StatCardProps){
    return (
        <div className="bg-panel border border-line rounded-md p-3"> 
         <div className="text-xs text-muted mb-1.5">{label}</div>
         <div className={`font-mono text-2xl font-medium ${colorClass}`}>{value}</div>
        </div>
    )
}

//Three headline numbers (on-time,average delay,cancellation), used for a whole route and a single train

export function StatsSummary ({summary}:{summary : RouteStatsSummary}){
    return (
        <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard
            label="On-Time"
            value={formatValue(summary.on_time_percentage,'%')}
            colorClass={getPercentageColor(summary.on_time_percentage)}
            />
            <StatCard
            label="Avg arrival delay"
            value={formatValue(summary.avg_arrival_delay_min,'m')}
            colorClass={getDelayColor(summary.avg_arrival_delay_min)}
            />
            <StatCard
            label="Cancellation"
            value={formatValue(summary.cancellation_rate_pct,'%')}
            colorClass={getCancellationColor(summary.cancellation_rate_pct)}
            />
        </div>
    )
}