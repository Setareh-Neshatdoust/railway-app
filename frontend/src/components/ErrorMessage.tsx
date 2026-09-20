interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="border border-signal-bad text-signal-bad rounded-md px-4 py-3 mb-6 text-sm">
      {message}
    </div>
  )
}