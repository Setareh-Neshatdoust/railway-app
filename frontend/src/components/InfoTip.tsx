// A small "i" that shows an explanation on mouse hover, on keyboard focus (Tab) and on tap (phone)
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] text-muted hover:text-primary focus:text-primary"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-line bg-panel p-2 text-xs text-primary opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}