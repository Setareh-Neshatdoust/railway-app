
import { useEffect } from 'react'

interface ToastProps {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
   <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md bg-panel border border-signal-bad text-signal-bad rounded-md px-6 py-4 shadow-lg text-lg z-50">
      {message}
    </div>
  )
}