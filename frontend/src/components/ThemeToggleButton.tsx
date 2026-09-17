interface ThemeToggleButtonProps {
  isDark: boolean
  onToggle: () => void
}

export function ThemeToggleButton({ isDark, onToggle }: ThemeToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-primary hover:border-accent transition-colors"
    >
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}