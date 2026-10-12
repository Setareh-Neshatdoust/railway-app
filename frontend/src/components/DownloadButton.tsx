
interface DownloadButtonProps {
  label: string
  onClick: () => void
}

export function DownloadButton({ label, onClick }: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-line rounded-md px-3 py-1 text-xs text-muted hover:text-primary"
    >
      ↓ {label}
    </button>
  )
}