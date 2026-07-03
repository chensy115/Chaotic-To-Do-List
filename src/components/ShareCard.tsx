import { forwardRef } from 'react'
import type { Stats, Task } from '../types'
import { calcPieIndex, getPieComment, getSlackerTitle } from '../utils/slackerProfile'
import { getTaskRot } from '../utils/taskRot'

interface Props {
  tasks: Task[]
  stats: Stats
}

/** 离屏分享卡片，供 html2canvas 截图 */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard({ tasks, stats }, ref) {
  const pieIndex = calcPieIndex(tasks, stats)
  const profile = getSlackerTitle(stats, pieIndex)
  const active = tasks.filter((t) => !t.completed)
  const mostRotten = active
    .map((t) => ({ task: t, rot: getTaskRot(t.createdAt) }))
    .sort((a, b) => b.rot.level - a.rot.level || b.rot.ageHours - a.rot.ageHours)[0]

  return (
    <div className="share-card" aria-hidden="true">
      <div className="share-card-inner" ref={ref}>
        <p className="share-card-brand">📋 赛博抬杠待办 · 摆烂报告</p>
        <div className="share-card-hero">
          <span className="share-card-emoji">{profile.emoji}</span>
          <div className="share-card-head-text">
            <h3 className="share-card-title">{profile.title}</h3>
            <p className="share-card-sub">{profile.subtitle}</p>
          </div>
          <span className="share-card-pie">{pieIndex}%</span>
        </div>
        <p className="share-card-comment">{getPieComment(pieIndex)}</p>
        <div className="share-card-stats">
          <span>🛡 劝退 {stats.rejected}</span>
          <span>🏃 逃跑 {stats.escaped}</span>
          <span>📅 甩锅 {stats.snoozed}</span>
          <span>💀 完成 {stats.completed}</span>
        </div>
        {mostRotten && (
          <p className="share-card-rot">
            🍄 最腐败：{mostRotten.task.text.slice(0, 40)}
            {mostRotten.task.text.length > 40 ? '…' : ''}（{mostRotten.rot.label}）
          </p>
        )}
        <p className="share-card-foot">普通的 Todo 催你上进，这个劝你躺平</p>
      </div>
    </div>
  )
})
