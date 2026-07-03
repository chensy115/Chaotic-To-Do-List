import { forwardRef, useMemo } from 'react'
import type { Stats, Task } from '../types'
import type { UnlockedBadge } from '../utils/badges'
import { getLast7DayPiePoints, type DailySnapshot } from '../utils/dailySnapshots'
import { calcPieIndex, getPieComment, getSlackerTitle } from '../utils/slackerProfile'
import { getTaskRot } from '../utils/taskRot'

interface Props {
  tasks: Task[]
  stats: Stats
  badges: UnlockedBadge[]
  snapshots: DailySnapshot[]
}

function weekStartMs(): number {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 离屏周报分享卡片，供 html2canvas 截图 */
export const WeeklyShareCard = forwardRef<HTMLDivElement, Props>(function WeeklyShareCard(
  { tasks, stats, badges, snapshots },
  ref
) {
  const pieIndex = calcPieIndex(tasks, stats)
  const profile = getSlackerTitle(stats, pieIndex)
  const weekStart = weekStartMs()

  const { weekAdded, weekCompleted, avgPie, mostRotten, weekBadgeCount } = useMemo(() => {
    const weekTasks = tasks.filter((t) => t.createdAt >= weekStart)
    const weekDone = tasks.filter(
      (t) => t.completed && (t.completedAt ?? t.createdAt) >= weekStart
    )
    const points = getLast7DayPiePoints(snapshots)
    const validPies = points.map((p) => p.pieIndex).filter((v): v is number => v != null)
    const avg =
      validPies.length > 0
        ? Math.round(validPies.reduce((a, b) => a + b, 0) / validPies.length)
        : pieIndex
    const active = tasks.filter((t) => !t.completed)
    const rotten = active
      .map((t) => ({ task: t, rot: getTaskRot(t.createdAt) }))
      .sort((a, b) => b.rot.level - a.rot.level || b.rot.ageHours - a.rot.ageHours)[0]
    const badgeCount = badges.filter((b) => b.unlockedAt >= weekStart).length
    return {
      weekAdded: weekTasks.length,
      weekCompleted: weekDone.length,
      avgPie: avg,
      mostRotten: rotten,
      weekBadgeCount: badgeCount,
    }
  }, [tasks, badges, snapshots, weekStart, pieIndex])

  const activeCount = tasks.filter((t) => !t.completed).length

  return (
    <div className="share-card" aria-hidden="true">
      <div className="share-card-inner" ref={ref}>
        <p className="share-card-brand">📋 赛博抬杠待办 · 本周摆烂周报</p>
        <div className="share-card-hero">
          <span className="share-card-emoji">{profile.emoji}</span>
          <div className="share-card-head-text">
            <h3 className="share-card-title">{profile.title}</h3>
            <p className="share-card-sub">{profile.subtitle}</p>
          </div>
          <span className="share-card-pie">{pieIndex}%</span>
        </div>
        <p className="share-card-comment">
          {getPieComment(pieIndex)} · 7 日均 {avgPie}%
        </p>
        <div className="share-card-stats">
          <span>📥 本周新增 {weekAdded}</span>
          <span>💀 本周完成 {weekCompleted}</span>
          <span>🛡 劝退 {stats.rejected}</span>
          <span>📅 甩锅 {stats.snoozed}</span>
          <span>进行中 {activeCount}</span>
          <span>累计完成 {stats.completed}</span>
        </div>
        {mostRotten && (
          <p className="share-card-rot">
            🍄 最腐败：{mostRotten.task.text.slice(0, 40)}
            {mostRotten.task.text.length > 40 ? '…' : ''}（{mostRotten.rot.label}）
          </p>
        )}
        {weekBadgeCount > 0 && (
          <p className="share-card-rot">🏅 本周新徽章 {weekBadgeCount} 枚</p>
        )}
        <p className="share-card-foot">普通的 Todo 催你上进，这个劝你躺平</p>
      </div>
    </div>
  )
})
