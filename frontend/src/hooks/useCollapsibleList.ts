import { useState } from 'react'

// Shows only the first `limit` items of a long list until the user expands it
export function useCollapsibleList<T>(items: T[], limit: number) {
  const [expanded, setExpanded] = useState(false)

  const visibleItems = expanded ? items : items.slice(0, limit)
  const hiddenCount = items.length - visibleItems.length

  return {
    visibleItems,
    hiddenCount,
    expanded,
    canToggle: items.length > limit,
    toggle: () => setExpanded(!expanded),
  }
}