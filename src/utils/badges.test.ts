import { describe, expect, it, beforeEach, vi } from 'vitest'
import { BADGE_DEFINITIONS, checkBadges, mergeBadgesFromImport } from './badges'
import { calcPieIndex } from './slackerProfile'
import type { Stats, Task } from '../types'

const baseStats: Stats = { rejected: 0, escaped: 0, completed: 0, snoozed: 0 }

const task = (text: string, overrides: Partial<Task> = {}): Task => ({
  id: '1',
  text,
  createdAt: Date.now(),
  completed: false,
  ...overrides,
})

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
})

describe('checkBadges', () => {
  it('unlocks reject-10 when rejected >= 10', () => {
    const stats = { ...baseStats, rejected: 10 }
    const newly = checkBadges(stats, [], [])
    expect(newly.map((b) => b.id)).toContain('reject-10')
  })

  it('does not duplicate unlocked badges', () => {
    const stats = { ...baseStats, rejected: 10 }
    const first = checkBadges(stats, [], [])
    const second = checkBadges(stats, [], first.map((b) => ({ id: b.id, unlockedAt: Date.now() })))
    expect(second).toHaveLength(0)
  })

  it('unlocks pie-90 when index high enough', () => {
    const tasks: Task[] = Array.from({ length: 10 }, (_, i) =>
      task(`考研${i}`, { id: String(i) })
    )
    const stats = { ...baseStats, rejected: 5 }
    const pie = calcPieIndex(tasks, stats)
    expect(pie).toBeGreaterThanOrEqual(90)
    const newly = checkBadges(stats, tasks, [])
    expect(newly.map((b) => b.id)).toContain('pie-90')
  })

  it('unlocks surrender when stats.surrendered >= 1', () => {
    const stats = { ...baseStats, surrendered: 1 }
    const newly = checkBadges(stats, [], [])
    expect(newly.map((b) => b.id)).toContain('surrender')
  })
})

describe('mergeBadgesFromImport', () => {
  it('merges incoming badges keeping earliest unlock', () => {
    const current = [{ id: 'reject-10', unlockedAt: 2000 }]
    const incoming = [{ id: 'reject-10', unlockedAt: 1000 }, { id: 'complete-5', unlockedAt: 3000 }]
    const merged = mergeBadgesFromImport(current, incoming)
    expect(merged.find((b) => b.id === 'reject-10')?.unlockedAt).toBe(1000)
    expect(merged.find((b) => b.id === 'complete-5')?.unlockedAt).toBe(3000)
  })

  it('ignores unknown badge ids', () => {
    const merged = mergeBadgesFromImport([], [{ id: 'fake', unlockedAt: 1 }])
    expect(merged).toHaveLength(0)
  })
})

describe('BADGE_DEFINITIONS', () => {
  it('has 7 badges with unique ids', () => {
    expect(BADGE_DEFINITIONS).toHaveLength(7)
    const ids = BADGE_DEFINITIONS.map((b) => b.id)
    expect(new Set(ids).size).toBe(7)
  })
})
