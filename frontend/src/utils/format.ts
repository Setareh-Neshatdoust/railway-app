
export function formatValue (value : number | null , suffix = ''): string {
    
    if (value === null) return '-'
    return `${value}${suffix}`
}

export function getPercentageColor (pct : number | null): string{

    if(pct === null) return 'text-signal-neutral'
    if(pct >= 80) return 'text-signal-good'
    if (pct >=50) return 'text-signal-warn'
    return 'text-signal-bad'
}
export function getCancellationColor(pct:number | null): string{
    if(pct === null) return 'text-signal-neutral'
    if(pct === 0) return 'text-signal-good'
    if(pct <= 5) return 'text-signal-warn'
    return 'text-signal-bad'
}
//delay in minutes, thresshold is considered 5 minutes
export function getDelayColor(minutes : number | null):string{
    if(minutes === null) return 'text-signal-neutral'
    if(minutes === 0 ) return 'text-signal-good'
    if(minutes <=5) return 'text-signal-warn'
    return 'text-signal-bad'
}