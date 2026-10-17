// Train category as a small label: FR, IC, REG...
// Three groups, three styles. No red or green, because in this app those colours mean good and bad punctuality

const CATEGORY_NAMES: Record<string, string> = {
  FR: 'Frecciarossa',
  FA: 'Frecciargento',
  FB: 'Frecciabianca',
  IC: 'Intercity',
  ICN: 'Intercity Notte',
  EC: 'EuroCity',
  EN: 'EuroNight',
  REG: 'Regionale',
  RV: 'Regionale Veloce',
  EXP: 'Espresso',
  BUS: 'Bus',
}

const HIGH_SPEED = ['FR', 'FA', 'FB']
const LONG_DISTANCE = ['IC', 'ICN', 'EC', 'EN']

function badgeStyle(code: string): string {
  if (HIGH_SPEED.includes(code)) return 'bg-primary text-page border-primary'
  if (LONG_DISTANCE.includes(code)) return 'text-accent border-accent'
  return 'text-muted border-muted border-dashed'
}

// One line under the train list that explains the three styles
export function CategoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1.5"><CategoryBadge category="FR" /> High-speed</span>
      <span className="flex items-center gap-1.5"><CategoryBadge category="IC" /> Intercity / international</span>
      <span className="flex items-center gap-1.5"><CategoryBadge category="REG" /> Regional</span>
    </div>
  )
}

export function CategoryBadge({ category }: { category: string | null }) {
  const code = (category ?? '').trim().toUpperCase()
  if (!code) return null
  return (
    <span
      title={CATEGORY_NAMES[code] ?? code}
      className={`inline-block min-w-11 rounded border px-1.5 py-0.5 text-center font-mono text-[11px] font-medium ${badgeStyle(code)}`}
    >
      {code}
    </span>
  )
}