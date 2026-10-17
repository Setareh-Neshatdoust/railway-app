import { useEffect, useState } from 'react'

// A round "↑ Top" button in the corner, shown only after scrolling down
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-10 rounded-full border border-line bg-panel px-4 py-2 text-sm shadow-md hover:border-accent hover:text-accent"
    >
      ↑ Top
    </button>
  )
}