import type { Stats, Task } from '../types'
import { calcPieIndex, getPieComment, getSlackerTitle } from './slackerProfile'
import { getTaskRot } from './taskRot'

export function generateSlackerReport(tasks: Task[], stats: Stats): string {
  const pieIndex = calcPieIndex(tasks, stats)
  const profile = getSlackerTitle(stats, pieIndex)
  const active = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()

  const todayAdded = tasks.filter((t) => t.createdAt >= todayMs).length
  const todayDone = done.filter((t) => (t.completedAt ?? t.createdAt) >= todayMs).length

  const mostRotten = active
    .map((t) => ({ task: t, rot: getTaskRot(t.createdAt) }))
    .sort((a, b) => b.rot.level - a.rot.level || b.rot.ageHours - a.rot.ageHours)[0]

  const lines = [
    '📋 赛博抬杠待办 · 今日摆烂报告',
    '',
    `${profile.emoji} ${profile.title} · 画饼指数 ${pieIndex}%`,
    profile.subtitle,
    getPieComment(pieIndex),
    '',
    `🛡 劝退 ${stats.rejected} · 🏃 逃跑 ${stats.escaped} · 📅 甩锅 ${stats.snoozed} · 💀 完成 ${stats.completed}`,
    `进行中 ${active.length} · 已完成 ${done.length}`,
    `今日新增 ${todayAdded} · 今日完成 ${todayDone}`,
  ]

  if (mostRotten) {
    lines.push('', `🍄 最腐败任务：${mostRotten.task.text}（${mostRotten.rot.label}）`)
  }

  lines.push('', '— 普通的 Todo 催你上进，这个劝你躺平')
  return lines.join('\n')
}
