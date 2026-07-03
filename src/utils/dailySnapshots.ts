import type { Stats, Task } from '../types'
import { calcPieIndex } from './slackerProfile'

const SNAPSHOTS_KEY = 'chaotic-daily-snapshots-v1'
const MAX_DAYS = 14

export interface DailySnapshot {
  date: string
  pieIndex: number
  recordedAt: number
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function loadDailySnapshots(): DailySnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (s): s is DailySnapshot =>
          s &&
          typeof s === 'object' &&
          typeof s.date === 'string' &&
          typeof s.pieIndex === 'number' &&
          typeof s.recordedAt === 'number'
      )
      .slice(-MAX_DAYS)
  } catch {
    return []
  }
}

export function saveDailySnapshots(snapshots: DailySnapshot[]) {
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots.slice(-MAX_DAYS)))
}

/** 记录今日画饼指数快照（同一天只保留最新一条） */
export function recordDailySnapshot(tasks: Task[], stats: Stats): DailySnapshot[] {
  const date = todayKey()
  const pieIndex = calcPieIndex(tasks, stats)
  const existing = loadDailySnapshots().filter((s) => s.date !== date)
  const next = [...existing, { date, pieIndex, recordedAt: Date.now() }].slice(-MAX_DAYS)
  saveDailySnapshots(next)
  return next
}

/** 近 7 日画饼曲线点（含今日，缺日补 null 或前值） */
export function getLast7DayPiePoints(snapshots: DailySnapshot[]): Array<{ date: string; pieIndex: number | null }> {
  const map = new Map(snapshots.map((s) => [s.date, s.pieIndex]))
  const points: Array<{ date: string; pieIndex: number | null }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = todayKey(d)
    points.push({ date: key, pieIndex: map.has(key) ? map.get(key)! : null })
  }
  return points
}

export function mergeSnapshotsFromImport(incoming: DailySnapshot[] | undefined): DailySnapshot[] {
  if (!incoming?.length) return loadDailySnapshots()
  const map = new Map(loadDailySnapshots().map((s) => [s.date, s]))
  for (const s of incoming) {
    if (typeof s.date === 'string' && typeof s.pieIndex === 'number') {
      map.set(s.date, s)
    }
  }
  const merged = [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_DAYS)
  saveDailySnapshots(merged)
  return merged
}
