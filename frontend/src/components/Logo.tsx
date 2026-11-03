export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M7 24 13 14l6 5 6-10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <g stroke="#fff" strokeWidth="2" fill="currentColor">
        <circle cx="7" cy="24" r="2.4" />
        <circle cx="13" cy="14" r="2.4" />
        <circle cx="19" cy="19" r="2.4" />
      </g>
      <circle cx="25" cy="9" r="3.2" fill="#fff" />
    </svg>
  )
}