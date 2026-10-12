
// The app stores dates as ISO text "YYYY-MM-DD" (URL, backend, downloads) and showa thwm in Italian format
// "2026-09-24" -> a Date at local
export function isoToDate(iso: string): Date | null {
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

// A Date -> "2026-09-24", built from the local day, month and year

export function dateToIso(date: Date | null): string {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// "2026-09-24" -> "24/09/2026", for showing dates on screen
export function formatItalianDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}