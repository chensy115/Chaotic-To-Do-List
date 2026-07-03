import type { Stats, Task } from '../types'
import { calcPieIndex } from './slackerProfile'
import { getTaskRot } from './taskRot'

export interface BadgeDefinition {
  id: string
  emoji: string
  title: string
  description: string
}

export interface UnlockedBadge {
  id: string
  unlockedAt: number
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'reject-10', emoji: '🛡', title: '劝退免疫体', description: '点了 10 次「好吧算了」' },
  { id: 'escape-50', emoji: '🏃', title: '按钮追逐赛冠军', description: '完成按钮累计逃跑 50 次' },
  { id: 'snooze-8', emoji: '📅', title: '明日复明日专家', description: '甩锅 8 次' },
  { id: 'complete-5', emoji: '🚨', title: '反常人类', description: '奇迹完成 5 个任务' },
  { id: 'pie-90', emoji: '📈', title: '画饼宗师', description: '画饼指数达到 90%' },
  { id: 'rot-boss', emoji: '🍄', title: '腐败领主', description: '养出一只 rot 4 级进行中任务' },
  { id: 'surrender', emoji: '🏳', title: '认命真香', description: '用过「算了，我认命」完成' },
]

const BADGES_KEY = 'chaotic-badges-v1'

export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id)
}

export function loadBadges(): UnlockedBadge[] {
  try {
    const raw = localStorage.getItem(BADGES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (b): b is UnlockedBadge =>
          b &&
          typeof b === 'object' &&
          typeof b.id === 'string' &&
          typeof b.unlockedAt === 'number' &&
          BADGE_DEFINITIONS.some((d) => d.id === b.id)
      )
      .slice(0, 20)
  } catch {
    return []
  }
}

export function saveBadges(badges: UnlockedBadge[]) {
  localStorage.setItem(BADGES_KEY, JSON.stringify(badges))
}

function meetsCondition(id: string, stats: Stats, tasks: Task[]): boolean {
  const active = tasks.filter((t) => !t.completed)
  const pieIndex = calcPieIndex(tasks, stats)

  switch (id) {
    case 'reject-10':
      return stats.rejected >= 10
    case 'escape-50':
      return stats.escaped >= 50
    case 'snooze-8':
      return stats.snoozed >= 8
    case 'complete-5':
      return stats.completed >= 5
    case 'pie-90':
      return pieIndex >= 90
    case 'rot-boss':
      return active.some((t) => getTaskRot(t.createdAt).level === 4)
    case 'surrender':
      return (stats.surrendered ?? 0) >= 1
    default:
      return false
  }
}

/** 返回新解锁的徽章定义（不含已解锁） */
export function checkBadges(
  stats: Stats,
  tasks: Task[],
  unlocked: UnlockedBadge[]
): BadgeDefinition[] {
  const known = new Set(unlocked.map((b) => b.id))
  const now = Date.now()
  const newly: BadgeDefinition[] = []

  for (const def of BADGE_DEFINITIONS) {
    if (known.has(def.id)) continue
    if (meetsCondition(def.id, stats, tasks)) {
      newly.push(def)
    }
  }

  if (newly.length > 0) {
    saveBadges([
      ...unlocked,
      ...newly.map((d) => ({ id: d.id, unlockedAt: now })),
    ])
  }

  return newly
}

export function mergeBadgesFromImport(
  current: UnlockedBadge[],
  incoming: UnlockedBadge[] | undefined
): UnlockedBadge[] {
  if (!incoming?.length) return current
  const map = new Map(current.map((b) => [b.id, b]))
  for (const b of incoming) {
    if (!BADGE_DEFINITIONS.some((d) => d.id === b.id)) continue
    const existing = map.get(b.id)
    if (!existing || b.unlockedAt < existing.unlockedAt) {
      map.set(b.id, { id: b.id, unlockedAt: b.unlockedAt })
    }
  }
  return [...map.values()].sort((a, b) => a.unlockedAt - b.unlockedAt)
}
