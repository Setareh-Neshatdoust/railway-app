import { Link, useSearchParams } from 'react-router-dom'
import { backFromUrl } from '../routes/searchParams'

interface BackLinkProps {
  label: string
}

// Goes up to the page that opened this one (saved in the address as "back"),
// not one step back in the browser history
export function BackLink({ label }: BackLinkProps) {
  const [searchParams] = useSearchParams()
  const to = backFromUrl(searchParams)
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-primary hover:border-accent hover:text-accent">
      ← {to === '/' ? 'New route search' : label}
    </Link>
  )
}