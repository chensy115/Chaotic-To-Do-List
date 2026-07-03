import type { TimelineEntry, TimelineKind } from '../types'

const TIMELINE_KEY = 'chaotic-timeline-v1'
const MAX_ENTRIES = 500

const KIND_ORDER: Record<TimelineKind, number> = {
  task_snooze: 6,
  task_done: 5,
  task_added: 4,
  report: 3,
  roast: 2,
  user: 1,
}

const VALID_KINDS = new Set<string>(Object.keys(KIND_ORDER))

function normalizeEntry(raw: unknown): TimelineEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (typeof e.id !== 'string' || typeof e.at !== 'number' || typeof e.text !== 'string') return null
  if (typeof e.kind !== 'string' || !VALID_KINDS.has(e.kind)) return null
  return {
    id: e.id.slice(0, 64),
    at: e.at,
    kind: e.kind as TimelineKind,
    text: e.text.slice(0, 500),
    taskId: typeof e.taskId === 'string' ? e.taskId.slice(0, 64) : undefined,
    meta:
      e.meta && typeof e.meta === 'object' && !Array.isArray(e.meta)
        ? (e.meta as Record<string, unknown>)
        : undefined,
  }
}

export function loadTimeline(): TimelineEntry[] {
  try {
    const raw = localStorage.getItem(TIMELINE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeEntry).filter((e): e is TimelineEntry => e !== null)
  } catch {
    return []
  }
}

export function saveTimeline(entries: TimelineEntry[]) {
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
}

export function sortTimeline(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (b.at !== a.at) return b.at - a.at
    return KIND_ORDER[b.kind] - KIND_ORDER[a.kind]
  })
}

export function appendTimelineEntry(
  entry: Omit<TimelineEntry, 'id' | 'at'> & { id?: string; at?: number },
  current?: TimelineEntry[]
): TimelineEntry[] {
  const base = current ?? loadTimeline()
  const full: TimelineEntry = {
    id: entry.id ?? crypto.randomUUID(),
    at: entry.at ?? Date.now(),
    kind: entry.kind,
    text: entry.text,
    taskId: entry.taskId,
    meta: entry.meta,
  }
  const next = [...base, full].slice(-MAX_ENTRIES)
  saveTimeline(next)
  return next
}

export function replaceTimeline(entries: TimelineEntry[]) {
  saveTimeline(entries.slice(-MAX_ENTRIES))
}

export function mergeTimelineFromImport(
  current: TimelineEntry[],
  incoming: TimelineEntry[] | undefined
): TimelineEntry[] {
  if (!incoming?.length) return current
  const map = new Map(current.map((e) => [e.id, e]))
  for (const e of incoming) {
    const norm = normalizeEntry(e)
    if (norm) map.set(norm.id, norm)
  }
  const merged = sortTimeline([...map.values()]).reverse().slice(-MAX_ENTRIES)
  saveTimeline(merged)
  return merged
}

export function timelineKindLabel(kind: TimelineKind): string {
  switch (kind) {
    case 'user':
      return '你'
    case 'roast':
      return 'AI'
    case 'report':
      return '战报'
    case 'task_added':
      return '加入'
    case 'task_done':
      return '完成'
    case 'task_snooze':
      return '甩锅'
  }
}

export function formatTimelineTime(at: number): string {
  const d = new Date(at)
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `今天 ${time}`
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}
