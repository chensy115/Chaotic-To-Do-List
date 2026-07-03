import { useCallback, useState } from 'react'
import type { Stats, Task } from '../types'
import {
  checkBadges,
  loadBadges,
  mergeBadgesFromImport,
  saveBadges,
  type BadgeDefinition,
  type UnlockedBadge,
} from '../utils/badges'

export function useBadges() {
  const [badges, setBadges] = useState<UnlockedBadge[]>(loadBadges)

  const checkAndUnlock = useCallback((stats: Stats, tasks: Task[]): BadgeDefinition[] => {
    const current = loadBadges()
    const newly = checkBadges(stats, tasks, current)
    if (newly.length > 0) {
      setBadges(loadBadges())
    }
    return newly
  }, [])

  const replaceFromImport = useCallback((incoming: UnlockedBadge[] | undefined) => {
    const merged = mergeBadgesFromImport(loadBadges(), incoming)
    saveBadges(merged)
    setBadges(merged)
    return merged
  }, [])

  return { badges, checkAndUnlock, replaceFromImport }
}
