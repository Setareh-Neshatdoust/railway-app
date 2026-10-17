interface ChartSlotProps {
  title: string
  shows: string
}

// The place kept for a chart of feature 4 (data visualization), says what it will show
export function ChartSlot({ title, shows }: ChartSlotProps) {
  return (
    <div className="border border-dashed border-line rounded-md p-5 mb-4 min-h-40 flex flex-col items-center justify-center gap-1 text-center">
      <span className="text-sm font-medium text-muted">{title}</span>
      <span className="text-xs text-muted max-w-md">{shows}</span>
      <span className="text-[11px] uppercase tracking-wide text-muted mt-2">Chart · planned (feature 4)</span>
    </div>
  )
}