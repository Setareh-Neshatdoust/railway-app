interface DownloadButtonProps {
  label: string
  onClick: () => void
}

// A secondary action, in the same soft blue as the Back button
export function DownloadButton({ label, onClick }: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md bg-secondary-bg px-3 py-1.5 text-sm font-medium text-secondary-fg hover:bg-secondary-hover"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
        <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
      </svg>
      {label}
    </button>
  )
}