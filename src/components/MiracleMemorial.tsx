import { useEffect, useMemo } from 'react'
import type { Task } from '../types'
import { BADGE_DEFINITIONS, type UnlockedBadge } from '../utils/badges'
import { sortCompletedTasks } from '../utils/sortTasks'

interface Props {
  open: boolean
  onClose: () => void
  tasks: Task[]
  badges: UnlockedBadge[]
}

export function MiracleMemorial({ open, onClose, tasks, badges }: Props) {
  const doneTasks = sortCompletedTasks(tasks.filter((t) => t.completed))
  const unlockedIds = new Set(badges.map((b) => b.id))

  const toughest = useMemo(() => {
    if (doneTasks.length === 0) return null
    return doneTasks.reduce((best, t) =>
      (t.escapeCount ?? 0) > (best.escapeCount ?? 0) ? t : best
    )
  }, [doneTasks])

  const showToughest = toughest != null && (toughest.escapeCount ?? 0) > 0

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay memorial-overlay" onClick={onClose} role="presentation">
      <div
        className="modal memorial-modal"
        role="dialog"
        aria-modal="true"
        aria-label="奇迹纪念馆"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>💀 奇迹纪念馆</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body memorial-body">
          <section className="memorial-badges" aria-label="成就徽章">
            <h3 className="memorial-section-title">🏅 摆烂徽章</h3>
            <ul className="badge-wall">
              {BADGE_DEFINITIONS.map((def) => {
                const unlocked = unlockedIds.has(def.id)
                const unlockedAt = badges.find((b) => b.id === def.id)?.unlockedAt
                return (
                  <li
                    key={def.id}
                    className={`badge-item ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                    title={unlocked ? def.description : `未解锁：${def.description}`}
                  >
                    <span className="badge-emoji">{def.emoji}</span>
                    <span className="badge-title">{def.title}</span>
                    {unlocked && unlockedAt && (
                      <span className="badge-date">
                        {new Date(unlockedAt).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {doneTasks.length === 0 ? (
            <p className="memorial-empty">还没有奇迹。去待办战场抓一次「完成打卡」吧。</p>
          ) : (
            <>
              {showToughest && toughest && (
                <section className="memorial-toughest" aria-label="最惨一仗">
                  <h3 className="memorial-section-title">🔥 最惨一仗</h3>
                  <div className="memorial-item surface-card memorial-item--toughest">
                    <div className="memorial-item-head">
                      <span className="task-text">{toughest.text}</span>
                      <span className="tag tag-accent">抓 {toughest.escapeCount} 次</span>
                    </div>
                    {toughest.completionRoast && (
                      <p className="task-done-roast">{toughest.completionRoast}</p>
                    )}
                  </div>
                </section>
              )}

              <section aria-label="已完成任务">
                <h3 className="memorial-section-title">全部奇迹</h3>
                <ul className="memorial-list">
                  {doneTasks.map((task) => {
                    const isToughest = showToughest && task.id === toughest?.id
                    if (isToughest) return null
                    return (
                      <li key={task.id} className="memorial-item surface-card">
                        <div className="memorial-item-head">
                          <span className="task-text">{task.text}</span>
                          {task.escapeCount != null && task.escapeCount > 0 && (
                            <span className="tag tag-muted">抓 {task.escapeCount} 次</span>
                          )}
                        </div>
                        {task.completionRoast && (
                          <p className="task-done-roast">{task.completionRoast}</p>
                        )}
                        {task.roast && (
                          <p className="task-done-origin">
                            当初抬杠：{task.roast.length > 80 ? `${task.roast.slice(0, 80)}…` : task.roast}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-accent" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
