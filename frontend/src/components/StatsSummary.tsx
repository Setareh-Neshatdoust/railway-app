import type { RouteStatsSummary } from "../api/types";
import { formatValue, getCancellationColor, getDelayColor, getPercentageColor } from "../utils/format";
import { InfoTip } from "./InfoTip";

interface StatCardProps {
    label : string
    value : string
    colorClass :string
    detail : string
    info : string
}

function StatCard ({label, value, colorClass, detail, info} : StatCardProps){
    return (
        <div className="bg-panel border border-line rounded-lg p-4">
         <div className="flex items-center text-xs text-muted mb-1.5">{label}<InfoTip text={info} /></div>
         <div className={`font-mono text-3xl font-medium ${colorClass}`}>{value}</div>
         <div className="text-xs text-muted mt-1.5">{detail}</div>
        </div>
    )
}

//Three headline numbers, averages over every train run in the chosen period
export function StatsSummary ({summary, period, runsOf}:{summary : RouteStatsSummary, period : string, runsOf? : string}){
    const runs = runsOf ? `${summary.total_records} runs of ${runsOf}` : `${summary.total_records} train runs`
    return (
        <div id="summary" className="scroll-mt-32">
            <p className="text-xs text-muted mb-2">
                Averages over {period} · {runs} train runs
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                label={`On-time rate (≤ ${summary.on_time_threshold_minutes} min)`}
                value={formatValue(summary.on_time_percentage,'%')}
                colorClass={getPercentageColor(summary.on_time_percentage)}
                detail={`arrived at most ${summary.on_time_threshold_minutes} min late`}
                info={`Share of train runs that arrived at most ${summary.on_time_threshold_minutes} minutes after the timetable. Cancelled runs and runs without a recorded arrival are not counted.`}
                />
                <StatCard
                label="Avg arrival delay"
                value={formatValue(summary.avg_arrival_delay_min,'m')}
                colorClass={getDelayColor(summary.avg_arrival_delay_min)}
                detail="mean of all train runs"
                info="Arrival delays of all train runs in the period, added up and divided by their number. Cancelled runs are not counted."
                />
                <StatCard
                label="Cancellation rate"
                value={formatValue(summary.cancellation_rate_pct,'%')}
                colorClass={getCancellationColor(summary.cancellation_rate_pct)}
                detail={`${summary.cancelled_count} of ${summary.total_records} runs cancelled`}
                info="Share of train runs in the period that TrainStats marks as cancelled (Soppresso)"
                />
            </div>
        </div>
    )
}