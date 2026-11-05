import { Link, useSearchParams } from 'react-router-dom'
import { backFromUrl } from '../routes/searchParams'

interface BackLinkProps {
  label: string
}
// The text of the button says where it goes. A train page can be opened from Route analysis
// or from a station page, so a station page is named by its two stations
function backLabel(to: string, label: string): string {
  if (to === '/') return 'New route search'
  const [path, query] = to.split('?')
  if (path === '/segment') {
    const params = new URLSearchParams(query)
    return `Back to ${params.get('origin')} → ${params.get('destination')}`
  }
  return label
}

export function BackLink({ label }: BackLinkProps) {
  const [searchParams] = useSearchParams()
  const to = backFromUrl(searchParams)
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-md bg-secondary-bg px-3 py-1.5 text-sm font-medium text-secondary-fg hover:bg-secondary-hover">
       ← {backLabel(to, label)}
    </Link>
  )
}