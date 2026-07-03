import { useCallback, useState } from 'react'
import type { TimelineEntry, TimelineKind } from '../types'
import {
  appendTimelineEntry,
  loadTimeline,
  mergeTimelineFromImport,
  replaceTimeline,
  sortTimeline,
} from '../utils/timeline'

export function useTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>(() => sortTimeline(loadTimeline()))

  const append = useCallback(
    (kind: TimelineKind, text: string, taskId?: string, meta?: Record<string, unknown>) => {
      const next = appendTimelineEntry({ kind, text, taskId, meta })
      setEntries(sortTimeline(next))
    },
    []
  )

  const replaceFromImport = useCallback((incoming: TimelineEntry[] | undefined) => {
    const merged = mergeTimelineFromImport(loadTimeline(), incoming)
    setEntries(sortTimeline(merged))
    return merged
  }, [])

  const replaceAll = useCallback((incoming: TimelineEntry[]) => {
    replaceTimeline(incoming)
    setEntries(sortTimeline(incoming))
  }, [])

  return { entries, append, replaceFromImport, replaceAll }
}
