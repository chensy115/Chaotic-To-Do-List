import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getLast7DayPiePoints, recordDailySnapshot } from './dailySnapshots'
import type { Stats, Task } from '../types'

const baseStats: Stats = { rejected: 0, escaped: 0, completed: 0, snoozed: 0 }

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
})

describe('dailySnapshots', () => {
  it('returns 7 points', () => {
    const points = getLast7DayPiePoints([])
    expect(points).toHaveLength(7)
  })

  it('records snapshot for today', () => {
    const tasks: Task[] = [
      { id: '1', text: '测试', createdAt: Date.now(), completed: false },
    ]
    const snapshots = recordDailySnapshot(tasks, baseStats)
    const today = new Date().toISOString().slice(0, 10)
    expect(snapshots.some((s) => s.date === today)).toBe(true)
  })
})
