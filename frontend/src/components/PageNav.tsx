export interface PageNavItem {
  id: string
  label: string
}

// A bar of the page's parts that stays visible under the header while scrolling.
// A click scrolls to that part; it is a button, so the browser history does not change
export function PageNav({ items }: { items: PageNavItem[] }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <nav
      aria-label="Parts of this page"
      className="sticky top-16 z-[5] flex flex-wrap gap-1 rounded-lg border border-line bg-page px-2 py-1.5"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => scrollTo(item.id)}
          className="rounded-md px-3 py-1 text-sm text-muted hover:bg-panel hover:text-primary"
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}