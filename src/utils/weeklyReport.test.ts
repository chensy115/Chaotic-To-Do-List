import { describe, expect, it } from 'vitest'
import { generateWeeklyReport } from './weeklyReport'
import type { Stats, Task } from '../types'

const baseStats: Stats = { rejected: 2, escaped: 10, completed: 3, snoozed: 1 }

describe('generateWeeklyReport', () => {
  it('includes title and stats lines', () => {
    const tasks: Task[] = [
      { id: '1', text: '背单词', createdAt: Date.now(), completed: false },
    ]
    const report = generateWeeklyReport(tasks, baseStats, [], [])
    expect(report).toContain('本周摆烂周报')
    expect(report).toContain('本周新增')
    expect(report).toContain('普通的 Todo 催你上进')
  })
})
