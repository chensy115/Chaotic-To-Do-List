import type { Stats, Task, TimelineEntry } from '../types'
import type { UnlockedBadge } from './badges'
import type { DailySnapshot } from './dailySnapshots'

export const STORAGE_VERSION = 3
const META_KEY = 'chaotic-meta'
const TASKS_KEY = 'chaotic-todos'
const STATS_KEY = 'chaotic-stats'

export interface BackupData {
  version: number
  exportedAt: number
  tasks: Task[]
  stats: Stats
  badges?: UnlockedBadge[]
  timeline?: TimelineEntry[]
  snapshots?: DailySnapshot[]
}

function normalizeTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== 'object') return null
  const t = raw as Record<string, unknown>
  if (typeof t.id !== 'string' || typeof t.text !== 'string' || typeof t.createdAt !== 'number') {
    return null
  }
  return {
    id: t.id.slice(0, 64),
    text: t.text.slice(0, 120),
    createdAt: t.createdAt,
    completed: Boolean(t.completed),
    roast: typeof t.roast === 'string' ? t.roast.slice(0, 500) : undefined,
    escapeCount: typeof t.escapeCount === 'number' ? t.escapeCount : undefined,
    snoozeCount: typeof t.snoozeCount === 'number' ? t.snoozeCount : undefined,
    lastSnoozeExcuse: typeof t.lastSnoozeExcuse === 'string' ? t.lastSnoozeExcuse.slice(0, 200) : undefined,
    completionRoast: typeof t.completionRoast === 'string' ? t.completionRoast.slice(0, 300) : undefined,
    completedAt: typeof t.completedAt === 'number' ? t.completedAt : undefined,
  }
}

function normalizeStats(raw: Partial<Stats> | undefined): Stats {
  return {
    rejected: Math.min(99999, Number(raw?.rejected) || 0),
    escaped: Math.min(99999, Number(raw?.escaped) || 0),
    completed: Math.min(99999, Number(raw?.completed) || 0),
    snoozed: Math.min(99999, Number(raw?.snoozed) || 0),
    surrendered: Math.min(99999, Number(raw?.surrendered) || 0) || undefined,
  }
}

function normalizeBadges(raw: unknown): UnlockedBadge[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw
    .filter(
      (b): b is UnlockedBadge =>
        b &&
        typeof b === 'object' &&
        typeof (b as UnlockedBadge).id === 'string' &&
        typeof (b as UnlockedBadge).unlockedAt === 'number'
    )
    .slice(0, 20)
}

function normalizeTimeline(raw: unknown): TimelineEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw
    .filter(
      (e): e is TimelineEntry =>
        e &&
        typeof e === 'object' &&
        typeof (e as TimelineEntry).id === 'string' &&
        typeof (e as TimelineEntry).at === 'number' &&
        typeof (e as TimelineEntry).text === 'string' &&
        typeof (e as TimelineEntry).kind === 'string'
    )
    .slice(0, 500)
}

function normalizeSnapshots(raw: unknown): DailySnapshot[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw
    .filter(
      (s): s is DailySnapshot =>
        s &&
        typeof s === 'object' &&
        typeof (s as DailySnapshot).date === 'string' &&
        typeof (s as DailySnapshot).pieIndex === 'number'
    )
    .slice(0, 14)
}

export function loadTasksFromStorage(): Task[] {
  try {
    const saved = localStorage.getItem(TASKS_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeTask).filter((t): t is Task => t !== null)
  } catch {
    return []
  }
}

export function saveTasksToStorage(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  localStorage.setItem(META_KEY, JSON.stringify({ version: STORAGE_VERSION, migratedAt: Date.now() }))
}

export function loadStatsFromStorage(defaultStats: Stats): Stats {
  try {
    const s = localStorage.getItem(STATS_KEY)
    if (!s) return defaultStats
    const parsed = JSON.parse(s) as Partial<Stats>
    return normalizeStats(parsed)
  } catch {
    return defaultStats
  }
}

export function saveStatsToStorage(stats: Stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function exportBackup(
  tasks: Task[],
  stats: Stats,
  badges?: UnlockedBadge[],
  timeline?: TimelineEntry[],
  snapshots?: DailySnapshot[]
): string {
  const data: BackupData = {
    version: STORAGE_VERSION,
    exportedAt: Date.now(),
    tasks,
    stats,
    badges,
    timeline,
    snapshots,
  }
  return JSON.stringify(data, null, 2)
}

export function importBackup(
  json: string
):
  | {
      tasks: Task[]
      stats: Stats
      badges?: UnlockedBadge[]
      timeline?: TimelineEntry[]
      snapshots?: DailySnapshot[]
    }
  | { error: string } {
  try {
    const data = JSON.parse(json) as Partial<BackupData>
    if (!data || typeof data !== 'object') return { error: '文件格式无效' }
    if (!Array.isArray(data.tasks)) return { error: '缺少 tasks 数组' }
    if (data.tasks.length > 500) return { error: '任务数量超出上限（500）' }

    const tasks = data.tasks.map(normalizeTask).filter((t): t is Task => t !== null)
    if (tasks.length === 0 && data.tasks.length > 0) return { error: '没有有效的任务数据' }

    const stats = normalizeStats(data.stats as Partial<Stats> | undefined)
    const badges = normalizeBadges(data.badges)
    const timeline = normalizeTimeline(data.timeline)
    const snapshots = normalizeSnapshots(data.snapshots)

    return { tasks, stats, badges, timeline, snapshots }
  } catch {
    return { error: 'JSON 解析失败' }
  }
}

export function downloadBackup(
  tasks: Task[],
  stats: Stats,
  badges?: UnlockedBadge[],
  timeline?: TimelineEntry[],
  snapshots?: DailySnapshot[]
) {
  const blob = new Blob([exportBackup(tasks, stats, badges, timeline, snapshots)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chaotic-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function clearOnboardingFlag() {
  localStorage.removeItem('chaotic-onboarding-v1')
  localStorage.removeItem('chaotic-onboarding-v2')
}
