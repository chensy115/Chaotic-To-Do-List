import { describe, expect, it } from 'vitest'
import { calcPieIndex, getSlackerTitle } from './slackerProfile'
import type { Stats, Task } from '../types'

const baseStats: Stats = { rejected: 0, escaped: 0, completed: 0, snoozed: 0 }

describe('calcPieIndex', () => {
  it('returns 0 for empty state with no stats', () => {
    expect(calcPieIndex([], baseStats)).toBe(0)
  })

  it('caps at 100', () => {
    const tasks: Task[] = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      text: '考研复习',
      createdAt: Date.now(),
      completed: false,
    }))
    expect(calcPieIndex(tasks, { ...baseStats, rejected: 20 })).toBeLessThanOrEqual(100)
  })
})

describe('getSlackerTitle', () => {
  it('returns high pie title', () => {
    const title = getSlackerTitle(baseStats, 95)
    expect(title.title).toBe('画饼宗师')
  })
})
