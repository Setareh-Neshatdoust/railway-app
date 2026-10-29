import { useEffect, useRef } from 'react'

interface AlertModalProps {
  message: string
  onClose: () => void
}
export function AlertModal({ message, onClose }: AlertModalProps) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButton.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
        className="w-full max-w-sm rounded-2xl bg-panel p-8 text-center shadow-xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-page text-signal-bad">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <h2 id="alert-modal-title" className="mt-6 text-xl font-semibold text-primary">Attention</h2>
        <p id="alert-modal-message" className="mt-2 text-base text-primary">{message}</p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-signal-bad py-3 text-base font-semibold text-white hover:opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  )
}