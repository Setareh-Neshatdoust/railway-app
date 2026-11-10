import { useEffect, useRef } from 'react'
import * as Plot from '@observablehq/plot'
import type { TrainStats } from '../api/types'
import { useNavigate } from 'react-router-dom'

// linkFor (optional) gives the address of a train's own page; with it, clicking a bar opens that page
interface OnTimeByTrainChartProps<T extends TrainStats> {
  trains: T[]
  linkFor?: (train: T) => string
}
// The same colours as the On time column of the table: green from 80%, amber from 50%, red below
function rateColor(rate: number): string {
  if (rate >= 80) return 'var(--rt-signal-good)'
  if (rate >= 50) return 'var(--rt-signal-warn)'
  return 'var(--rt-signal-bad)'
}

// One horizontal bar per train: its on-time rate on a common scale from 0 to 100%, sorted from best to worst.
// Overview first, details on demand: the bars alone give the ranking, and pointing at a bar
// shows its numbers (trips, cancellations, average delay) in a tooltip.
export function OnTimeByTrainChart<T extends TrainStats>({ trains, linkFor }: OnTimeByTrainChartProps<T>) {
  const container = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof Plot.plot> | null>(null)
  const navigate = useNavigate()
  const clickable = linkFor !== undefined

  useEffect(() => {
    const element = container.current
    if (!element) return

    // Trains without a measurable on-time rate (all trips cancelled or without arrival) are left out
    const data = trains
      .filter((train) => train.on_time_percentage !== null)
      .map((train) => ({
        train,
        label: `${train.category ?? ''} ${train.train_number}`.trim(),
        rate: train.on_time_percentage as number,
        trips: train.total_records,
        cancelled: train.cancelled_count,
        delay: train.avg_arrival_delay_min,
      }))
    if (data.length === 0) return
        // The lines of the tooltip
    const tipText = (d: (typeof data)[number]) => [
      d.label,
      `On time: ${d.rate}%`,
      `Trips: ${d.trips}${d.cancelled > 0 ? ` (${d.cancelled} cancelled)` : ''}`,
      d.delay !== null ? `Average arrival delay: ${d.delay} min` : null,
      clickable ? 'Click to open the train' : null,
    ].filter(Boolean).join('\n')
    

    // One horizontal bar per train, sorted from best to worst: the names stay readable on the left,
    // and with many trains the chart grows downwards instead of shrinking
    const chart = Plot.plot({
      width: element.clientWidth,
      height: 40 + data.length * 22,
      marginLeft: 90,
      x: { domain: [0, 100], label: 'On-time rate (%) →', grid: true, axis: 'top' },
      y: { label: null, axis: null },
      marks: [
        Plot.axisY({ textAnchor: 'start', dx: -76, tickSize: 0 }),
        Plot.barX(data, { y: 'label', x: 'rate', sort: { y: '-x' }, fill: (d) => rateColor(d.rate), fillOpacity: 0.75, inset: 1 }),
        // The bar under the pointer gets a full colour and an outline, and its numbers appear in a tooltip
        Plot.barX(data, Plot.pointerY({ y: 'label', x: 'rate', fill: (d) => rateColor(d.rate), stroke: 'currentColor', strokeWidth: 1.5, inset: 1 })),
        Plot.tip(data, Plot.pointerY({ y: 'label', x: 'rate', title: tipText })),
        Plot.ruleX([0]),
      ],
      ariaLabel: 'On-time rate by train',
    })
        // The hand cursor appears only when the pointer is on a bar, to show that it can be clicked
    if (clickable) {
      chart.addEventListener('input', () => {
        chart.style.cursor = chart.value ? 'pointer' : ''
      })
    }

    element.replaceChildren(chart)
    chartRef.current = chart
    return () => chart.remove()
  }, [trains, clickable])

  // On a click, chart.value is the train under the pointer (set by the pointer marks), or null
  function openClickedTrain() {
    const clicked: { train: T } | null | undefined = chartRef.current?.value
    if (clicked && linkFor) navigate(linkFor(clicked.train))
  }

  return <div ref={container} onClick={openClickedTrain} className="chart mb-4 text-xs text-primary" />
}