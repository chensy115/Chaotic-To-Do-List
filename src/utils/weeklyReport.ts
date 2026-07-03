import type { Stats, Task } from '../types'
import type { UnlockedBadge } from './badges'
import { calcPieIndex, getPieComment, getSlackerTitle } from './slackerProfile'
import { getLast7DayPiePoints, type DailySnapshot } from './dailySnapshots'
import { getTaskRot } from './taskRot'

function weekStartMs(): number {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function generateWeeklyReport(
  tasks: Task[],
  stats: Stats,
  badges: UnlockedBadge[],
  snapshots: DailySnapshot[]
): string {
  const pieIndex = calcPieIndex(tasks, stats)
  const profile = getSlackerTitle(stats, pieIndex)
  const weekStart = weekStartMs()

  const weekTasks = tasks.filter((t) => t.createdAt >= weekStart)
  const weekDone = tasks.filter(
    (t) => t.completed && (t.completedAt ?? t.createdAt) >= weekStart
  )
  const weekAdded = weekTasks.length
  const weekCompleted = weekDone.length

  const points = getLast7DayPiePoints(snapshots)
  const validPies = points.map((p) => p.pieIndex).filter((v): v is number => v != null)
  const avgPie =
    validPies.length > 0
      ? Math.round(validPies.reduce((a, b) => a + b, 0) / validPies.length)
      : pieIndex

  const active = tasks.filter((t) => !t.completed)
  const mostRotten = active
    .map((t) => ({ task: t, rot: getTaskRot(t.createdAt) }))
    .sort((a, b) => b.rot.level - a.rot.level || b.rot.ageHours - a.rot.ageHours)[0]

  const weekBadges = badges.filter((b) => b.unlockedAt >= weekStart)

  const lines = [
    '📋 赛博抬杠待办 · 本周摆烂周报',
    '',
    `${profile.emoji} ${profile.title} · 当前画饼 ${pieIndex}% · 7 日均 ${avgPie}%`,
    getPieComment(pieIndex),
    '',
    `本周新增 ${weekAdded} · 完成 ${weekCompleted} · 劝退 ${stats.rejected} · 甩锅 ${stats.snoozed}`,
    `进行中 ${active.length} · 累计完成 ${stats.completed}`,
  ]

  if (mostRotten) {
    lines.push('', `🍄 最腐败：${mostRotten.task.text}（${mostRotten.rot.label}）`)
  }

  if (weekBadges.length > 0) {
    lines.push('', `🏅 本周新徽章：${weekBadges.length} 枚`)
  }

  lines.push('', '— 普通的 Todo 催你上进，这个劝你躺平')
  return lines.join('\n')
}
