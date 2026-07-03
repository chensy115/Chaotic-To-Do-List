import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { sortActiveTasksByRot, sortCompletedTasks } from './sortTasks'

describe('sortActiveTasksByRot', () => {
  it('puts higher rot level first', () => {
    const now = Date.now()
    const tasks: Task[] = [
      { id: '1', text: 'new', createdAt: now, completed: false },
      { id: '2', text: 'old', createdAt: now - 30 * 3_600_000, completed: false },
    ]
    const sorted = sortActiveTasksByRot(tasks)
    expect(sorted[0].id).toBe('2')
  })
})

describe('sortCompletedTasks', () => {
  it('sorts by completedAt descending', () => {
    const tasks: Task[] = [
      { id: '1', text: 'a', createdAt: 1, completed: true, completedAt: 100 },
      { id: '2', text: 'b', createdAt: 2, completed: true, completedAt: 200 },
    ]
    expect(sortCompletedTasks(tasks).map((t) => t.id)).toEqual(['2', '1'])
  })
})
