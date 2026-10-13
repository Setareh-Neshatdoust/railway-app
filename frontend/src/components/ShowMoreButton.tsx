interface ShowMoreButtonProps {
  expanded: boolean
  hiddenCount: number
  onToggle: () => void
}

export function ShowMoreButton({ expanded, hiddenCount, onToggle }: ShowMoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="w-full px-4 py-2 text-xs text-accent hover:underline border-t border-line"
    >
      {expanded ? 'Show less ▲' : `Show all (${hiddenCount} more) ▼`}
    </button>
  )
}