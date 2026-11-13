import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Plot from '@observablehq/plot'
import type { StationStats } from '../api/types'

interface DelayAlongRouteChartProps {
  stations: StationStats[]   // in travel order, as the backend sends them
  threshold: number          // the on-time limit in minutes, drawn as a reference line
  linkFor?: (station: string) => string   // optional: the address of origin → that station; with it, clicking a station opens it
}

// The stations in travel order from left to right, with two bars each: the average arrival delay
// (solid) and the average departure delay (light, outlined), coloured like the delays in the tables.
// A time that was never recorded gets no bar. Pointing at a bar shows the numbers of its station.

// The same colours as the delays in the tables: green on time or early, amber up to the limit, red above
function delayColor(delay: number, threshold: number): string {
  if (delay <= 0) return 'var(--rt-signal-good)'
  if (delay <= threshold) return 'var(--rt-signal-warn)'
  return 'var(--rt-signal-bad)'
}

export function DelayAlongRouteChart({ stations, threshold, linkFor }: DelayAlongRouteChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof Plot.plot> | null>(null)
  const navigate = useNavigate()
  const clickable = linkFor !== undefined

  useEffect(() => {
    const element = container.current
    if (!element) return

    const data = stations.map((station, index) => ({
      station: station.station,
      first: index === 0,   // the origin of the search: there is no page "origin → origin"
      arrival: station.avg_arrival_delay_min,
      departure: station.avg_departure_delay_min,
      onTime: station.on_time_percentage,
      trips: station.days_checked,
    }))
    // Two bars per station, side by side: first the arrival, then the departure (the order of travel).
    // A value that was not recorded (null) gets no bar
    const bars = data.flatMap((d) => [
      { ...d, kind: 'Arrival', delay: d.arrival },
      { ...d, kind: 'Departure', delay: d.departure },
    ]).filter((bar) => bar.delay !== null)
    if (bars.length === 0) return

    // At least 44 px per station (two bars), so the slanted names never overlap. Most routes fit in the box;
    // a very long one becomes wider than the box, and the box scrolls sideways
    const width = Math.max(element.clientWidth, 70 + data.length * 44)

    const chart = Plot.plot({
      width,
      height: 320,
      marginLeft: 70,   // room for the first slanted name
      marginRight: 90,
      marginBottom: 110,
      // Plot normally shrinks a wide chart to the box (max-width: 100%); here it keeps its size and scrolls
      style: { maxWidth: 'none' },
      // fx: one group per station, in travel order; x: the two bars inside each group
      fx: { domain: data.map((d) => d.station), label: null, tickRotate: -45, padding: 0.15, axis: 'bottom' },
      x: { domain: ['Arrival', 'Departure'], axis: null, paddingInner: 0.1 },
      y: { label: '↑ Average delay (min)', grid: true, nice: true },
      marks: [
        // Arrival: a solid bar. Departure: a light bar with an outline. Both coloured by their own delay
        Plot.barY(bars, {
          fx: 'station',
          x: 'kind',
          y: 'delay',
          fill: (d) => delayColor(d.delay as number, threshold),
          fillOpacity: (d) => (d.kind === 'Arrival' ? 0.85 : 0.3),
          stroke: (d) => delayColor(d.delay as number, threshold),
        }),
        Plot.ruleY([0]),
        // The on-time limit, drawn on top of the data, with its label in the right margin
        Plot.ruleY([threshold], { strokeDasharray: '5,4', strokeWidth: 1.5 }),
        // The label only once, next to the last station (otherwise it would repeat in every group)
        Plot.text([threshold], {
          fx: () => data[data.length - 1].station,
          y: (d) => d,
          frameAnchor: 'right',
          textAnchor: 'start',
          dx: 6,
          text: () => `${threshold} min threshold`,
        }),
        // The bar under the pointer gets an outline, and its station's numbers appear in a tooltip
        Plot.barY(bars, Plot.pointerX({ fx: 'station', x: 'kind', y: 'delay', py: 'delay', fill: null, stroke: 'currentColor', strokeWidth: 1.5 })),
        Plot.tip(bars, Plot.pointerX({
          fx: 'station',
          x: 'kind',
          y: 'delay',
          title: (d) => [
            d.station,
            `Average arrival delay: ${d.arrival !== null ? `${d.arrival} min` : '–'}`,
            `Average departure delay: ${d.departure !== null ? `${d.departure} min` : '–'}`,
            d.onTime !== null ? `On time: ${d.onTime}%` : null,
            `Trips: ${d.trips}`,
            clickable && !d.first ? 'Click to open the trip to this station' : null,
          ].filter(Boolean).join('\n'),
        })),
      ],
      ariaLabel: 'Average delay along the route',
    })

    // The hand cursor appears only on a station that can be opened
    if (clickable) {
      chart.addEventListener('input', () => {
        chart.style.cursor = chart.value && !chart.value.first ? 'pointer' : ''
      })
    }

    element.replaceChildren(chart)
    chartRef.current = chart
    return () => chart.remove()
  }, [stations, threshold, clickable])

  // On a click, chart.value is the station under the pointer (set by the tooltip), or null
  function openClickedStation() {
    const clicked: { station: string; first: boolean } | null | undefined = chartRef.current?.value
    if (clicked && !clicked.first && linkFor) navigate(linkFor(clicked.station))
  }

  return (
    <div className="mb-4">
      <div ref={container} onClick={openClickedStation} className="chart overflow-x-auto text-xs text-primary" />
      <p className="mt-1 text-xs text-muted">
        <span className="inline-block h-2.5 w-2.5 bg-signal-warn align-middle" /> arrival
        {' · '}
        <span className="inline-block h-2.5 w-2.5 border border-signal-warn bg-signal-warn/30 align-middle" /> departure
        {' '}(colour: green on time, amber up to {threshold} min, red above)
      </p>
    </div>
  )
}