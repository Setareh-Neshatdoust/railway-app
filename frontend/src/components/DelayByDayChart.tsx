import { useEffect, useRef } from 'react'
import * as Plot from '@observablehq/plot'
import type { DayStats } from '../api/types'
import { formatItalianDate } from '../utils/dates'
import { useNavigate } from 'react-router-dom'

interface DelayByDayChartProps {
  days: DayStats[]
  threshold: number   // the on-time limit in minutes, drawn as a reference line
  linkFor?: (isoDate: string) => string   // optional: the address of the stops of one day; with it, clicking a day opens it
}

// The same colours as the delays in the tables: green on time or early, amber up to the limit, red above
function delayColor(delay: number, threshold: number): string {
  if (delay <= 0) return 'var(--rt-signal-good)'
  if (delay <= threshold) return 'var(--rt-signal-warn)'
  return 'var(--rt-signal-bad)'
}

// One bar per day: the average arrival delay of the trips of that day (below zero if they arrived early).
// The dashed line is the on-time limit, so the bars above it stand out without colour.
// Days on which every trip was cancelled have no delay: they are marked with × on the zero line.
// Pointing at a day shows its numbers (details on demand).

export function DelayByDayChart({ days, threshold, linkFor }: DelayByDayChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof Plot.plot> | null>(null)
  const navigate = useNavigate()
  const clickable = linkFor !== undefined

  useEffect(() => {
    const element = container.current
    if (!element) return

    const data = days.map((day) => ({
      date: new Date(day.date),
      iso: day.date,
      delay: day.avg_arrival_delay_min,
      trips: day.total_records,
      cancelled: day.cancelled_count,
      onTime: day.on_time_percentage,
      notes: day.notes,
    }))
    const measured = data.filter((d) => d.delay !== null)
    const allCancelled = data.filter((d) => d.delay === null && d.cancelled > 0)
    if (data.length === 0) return

    const chart = Plot.plot({
      width: element.clientWidth,
      height: 280,
      marginLeft: 50,
      marginRight: 80,
      x: { type: 'utc', label: null, tickFormat: '%d/%m', inset: 8 },
      y: { label: '↑ Average arrival delay (min)', grid: true, nice: true },
      marks: [
        Plot.rectY(measured, { x: 'date', interval: 'day', y: 'delay', inset: 1, fill: (d) => delayColor(d.delay as number, threshold), fillOpacity: 0.75 }),
        Plot.ruleY([0]),
        Plot.dot(allCancelled, { x: 'date', y: 0, symbol: 'times', r: 4, strokeWidth: 1.5 }),
        // The on-time limit, drawn on top of the data so the bars never hide it, with its label
        // in the right margin, outside the plotting area
        Plot.ruleY([threshold], { strokeDasharray: '5,4', strokeWidth: 1.5 }),
        Plot.text([threshold], {
          y: (d) => d,
          frameAnchor: 'right',
          textAnchor: 'start',
          dx: 6,
          text: () => `${threshold} min threshold`,
        }),
        // The day under the pointer keeps its colour and gets an outline, and its numbers appear in a tooltip
        Plot.rectY(measured, Plot.pointerX({ x: 'date', interval: 'day', y: 'delay', inset: 1, fill: (d) => delayColor(d.delay as number, threshold), stroke: 'currentColor', strokeWidth: 1.5, maxRadius: 30 })),
        Plot.tip(data, Plot.pointerX({
          x: 'date',
          y: (d) => d.delay ?? 0,
          maxRadius: 30,
          title: (d) => [
            `${formatItalianDate(d.iso)} (${d.date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })})`,
            d.delay === null
              ? 'No arrival recorded'
              : d.trips === 1
                ? `Arrival delay: ${d.delay} min`
                : `Average arrival delay: ${d.delay} min`,
            d.trips > 1 && d.onTime !== null ? `On time: ${d.onTime}%` : null,
            `Trips: ${d.trips}${d.cancelled > 0 ? ` (${d.cancelled} cancelled)` : ''}`,
            d.notes.length > 0 ? d.notes.join(' · ') : null,
            clickable ? 'Click to open the stops of this day' : null,
          ].filter(Boolean).join('\n'),
        })),
      ],
      ariaLabel: 'Average arrival delay by day',
    })

        // The hand cursor appears only when the pointer is on a day, to show that it can be clicked
    if (clickable) {
      chart.addEventListener('input', () => {
        chart.style.cursor = chart.value ? 'pointer' : ''
      })
    }

    element.replaceChildren(chart)
    chartRef.current = chart
    return () => chart.remove()
  }, [days, threshold, clickable])

  // On a click, chart.value is the day under the pointer (set by the tooltip), or null
  function openClickedDay() {
    const clicked: { iso: string } | null | undefined = chartRef.current?.value
    if (clicked && linkFor) navigate(linkFor(clicked.iso))
  }

  const hasCancelledDays = days.some((day) => day.avg_arrival_delay_min === null && day.cancelled_count > 0)

  return (
    <div className="mb-4">
      <div ref={container} className="chart text-xs text-primary" />
      {hasCancelledDays && <p className="mt-1 text-xs text-muted">× = every trip of that day was cancelled</p>}
      <div ref={container} onClick={openClickedDay} className="chart text-xs text-primary" />
    </div>
  )
}