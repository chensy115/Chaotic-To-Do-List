import { useCallback, useState } from 'react'
import type { Stats } from '../types'
import { loadStatsFromStorage, saveStatsToStorage } from '../utils/storage'

export const DEFAULT_STATS: Stats = { rejected: 0, escaped: 0, completed: 0, snoozed: 0 }

export function useStats() {
  const [stats, setStats] = useState<Stats>(() => loadStatsFromStorage(DEFAULT_STATS))

  const persistStats = useCallback((next: Stats) => {
    setStats(next)
    saveStatsToStorage(next)
  }, [])

  return { stats, persistStats }
}
