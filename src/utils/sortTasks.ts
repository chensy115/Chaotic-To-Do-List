import type { Task } from '../types'
import { getTaskRot } from './taskRot'

/** 进行中：腐败度降序，最烂最上 */
export function sortActiveTasksByRot(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const ra = getTaskRot(a.createdAt)
    const rb = getTaskRot(b.createdAt)
    if (rb.level !== ra.level) return rb.level - ra.level
    return rb.ageHours - ra.ageHours
  })
}

/** 已完成：完成时间降序，刚完成在上 */
export function sortCompletedTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt)
  )
}
