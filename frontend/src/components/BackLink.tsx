import { Link, useSearchParams } from 'react-router-dom'
import { backFromUrl } from '../routes/searchParams'

interface BackLinkProps {
  label: string
}
export function BackLink({ label }: BackLinkProps) {
  const [searchParams] = useSearchParams()
  const to = backFromUrl(searchParams)
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-md bg-secondary-bg px-3 py-1.5 text-sm font-medium text-secondary-fg hover:bg-secondary-hover">
      ← {to === '/' ? 'New route search' : label}
    </Link>
  )
}