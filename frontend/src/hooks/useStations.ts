import { useEffect, useState } from 'react'
import { getStations } from '../api/client'


export function useStations() {
  const [stations, setStations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getStations()
      .then((data) => {
        if (!cancelled) setStations(data)
      })
      .catch(() => {
        if (!cancelled) setStations([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { stations, isLoading }
}