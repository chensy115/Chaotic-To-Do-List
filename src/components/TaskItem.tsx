import { useEffect, useState } from 'react'
import type { Task } from '../types'
import { generateCompletionRoast } from '../utils/roastEngine'
import { generateSnoozeExcuse } from '../utils/snoozeExcuses'
import { getRotClass, getTaskRot, pickBossTaunt } from '../utils/taskRot'
import { useIsMobile } from '../hooks/useIsMobile'
import { EscapingCheckbox } from './EscapingCheckbox'

interface Props {
  task: Task
  index?: number
  onComplete: (id: string, escapeCount: number, completionRoast: string, viaSurrender?: boolean) => void
  onDelete: (id: string) => void
  onSnooze: (id: string, excuse: string) => void
}

export function TaskItem({ task, index = 0, onComplete, onDelete, onSnooze }: Props) {
  const isMobile = useIsMobile()
  const [escapeCount, setEscapeCount] = useState(0)
  const [completionMsg, setCompletionMsg] = useState('')
  const [completing, setCompleting] = useState(false)
  const [rot, setRot] = useState(() => getTaskRot(task.createdAt))
  const [bossTauntIdx, setBossTauntIdx] = useState(0)
  const isBoss = rot.level === 4

  useEffect(() => {
    const tick = () => setRot(getTaskRot(task.createdAt))
    tick()
    const timer = setInterval(tick, 60_000)
    return () => clearInterval(timer)
  }, [task.createdAt])

  useEffect(() => {
    if (!isBoss) return
    const timer = setInterval(() => setBossTauntIdx((i) => i + 1), 30_000)
    return () => clearInterval(timer)
  }, [isBoss])

  const displayTaunt = isBoss ? pickBossTaunt(bossTauntIdx) : rot.taunt

  const snoozeBonus = (task.snoozeCount ?? 0) * 8
  const fleeRadius = rot.fleeRadius + snoozeBonus
  const baseArena = isMobile
    ? Math.max(160, rot.arenaHeight + Math.min(40, (task.snoozeCount ?? 0) * 8))
    : Math.max(120, rot.arenaHeight + Math.min(30, (task.snoozeCount ?? 0) * 6))

  const handleComplete = (viaSurrender?: boolean) => {
    const msg = generateCompletionRoast(escapeCount)
    setCompletionMsg(msg)
    setCompleting(true)
    setTimeout(() => onComplete(task.id, escapeCount, msg, viaSurrender), 1600)
  }

  const handleSnooze = () => {
    const excuse = generateSnoozeExcuse(task.text, rot)
    onSnooze(task.id, excuse)
  }

  const showComplete = task.completed || completing

  return (
    <li
      className={`battle-card surface-card ${getRotClass(rot.level)} ${isBoss ? 'battle-card--boss' : ''} ${showComplete ? 'completed' : ''} animate-in slide-in-right`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {!showComplete && (
        <div className="battle-rot">
          <div className="battle-rot-head">
            <span className="battle-rot-label">腐败度</span>
            <span className="battle-rot-meta">
              {rot.emoji} {rot.label}
              {isBoss && ' · BOSS'}
              {rot.level >= 2 && !isBoss && ` · ${Math.floor(rot.ageHours)}h 未动`}
              {isBoss && ` · ${Math.floor(rot.ageHours)}h 化石`}
            </span>
          </div>
          <div className="rot-bar">
            <div className="rot-fill" style={{ width: `${rot.rotPercent}%` }} />
          </div>
          {rot.level >= 1 && (
            <p className="battle-rot-taunt" title={displayTaunt}>
              {displayTaunt}
            </p>
          )}
        </div>
      )}

      <div className="task-header">
        <h3 className="task-text">{task.text}</h3>
        {!showComplete && (
          <div className="task-actions">
            <button type="button" className="btn btn-snooze" onClick={handleSnooze}>
              明日再战
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-delete"
              onClick={() => onDelete(task.id)}
              title="删除"
              aria-label="删除任务"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {!showComplete && (task.snoozeCount ?? 0) > 0 && (
        <div className="task-tags">
          <span className="tag tag-muted">甩锅 ×{task.snoozeCount}</span>
        </div>
      )}

      {!showComplete && (task.roast || task.lastSnoozeExcuse) && (
        <div className="task-aside">
          {task.roast && (
            <p className="task-aside-line">
              💬 {task.roast.length > 80 ? `${task.roast.slice(0, 80)}…` : task.roast}
            </p>
          )}
          {task.lastSnoozeExcuse && (
            <p className="task-aside-line task-aside-snooze">{task.lastSnoozeExcuse}</p>
          )}
        </div>
      )}

      {!showComplete ? (
        <div className="capture-zone">
          <span className="capture-label">抓捕区</span>
          <EscapingCheckbox
            onComplete={handleComplete}
            onEscape={setEscapeCount}
            fleeRadius={fleeRadius}
            arenaHeight={baseArena}
            glitch={escapeCount > 5 || isBoss}
            mobile={isMobile}
            surrenderAt={isBoss ? 8 : 10}
          />
        </div>
      ) : (
        <div className="completion-banner">
          {completionMsg || '居然完成了，太阳从西边出来了。'}
        </div>
      )}
    </li>
  )
}
