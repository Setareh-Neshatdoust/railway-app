import type { ReactNode } from 'react'

interface SectionProps {
  id?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

// One card of a page: a title, an optional line of explanation, optional buttons on the right
export function Section({ id, title, description, actions, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-32 bg-panel border border-line rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted mt-1">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}