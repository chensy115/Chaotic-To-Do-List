const DAILY_STATS_KEY = 'chaotic-daily-stats-v1'

export interface DailyStats {
  date: string
  added: number
  done: number
  snoozed: number
  rejected: number
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function loadDailyStats(): DailyStats {
  try {
    const raw = localStorage.getItem(DAILY_STATS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DailyStats
      if (parsed.date === todayKey()) return parsed
    }
  } catch {
    // ignore
  }
  return { date: todayKey(), added: 0, done: 0, snoozed: 0, rejected: 0 }
}

export function saveDailyStats(stats: DailyStats) {
  localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats))
}

export function bumpDailyStat(field: keyof Omit<DailyStats, 'date'>): DailyStats {
  const current = loadDailyStats()
  const next = { ...current, [field]: current[field] + 1 }
  saveDailyStats(next)
  return next
}

export function isChallengeMet(challengeId: string, daily: DailyStats): boolean {
  switch (challengeId) {
    case 'no-snooze':
      if (daily.snoozed > 0) return false
      return daily.added + daily.done + daily.rejected >= 1
    case 'one-add':
      return daily.added === 1
    case 'one-done':
      return daily.done >= 1
    case 'one-reject':
      return daily.rejected >= 1
    default:
      return false
  }
}

export function isChallengeFailed(challengeId: string, daily: DailyStats): boolean {
  switch (challengeId) {
    case 'no-snooze':
      return daily.snoozed > 0
    case 'one-add':
      return daily.added > 1
    default:
      return false
  }
}
