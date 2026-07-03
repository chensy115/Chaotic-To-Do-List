import { describe, expect, it } from 'vitest'
import { isChallengeMet, isChallengeFailed } from './dailyStats'
import type { DailyStats } from './dailyStats'

const daily = (over: Partial<DailyStats> = {}): DailyStats => ({
  date: '2026-07-03',
  added: 0,
  done: 0,
  snoozed: 0,
  rejected: 0,
  ...over,
})

describe('dailyStats challenges', () => {
  it('one-add succeeds only at exactly 1', () => {
    expect(isChallengeMet('one-add', daily({ added: 1 }))).toBe(true)
    expect(isChallengeMet('one-add', daily({ added: 2 }))).toBe(false)
    expect(isChallengeFailed('one-add', daily({ added: 2 }))).toBe(true)
  })

  it('no-snooze fails after snooze', () => {
    expect(isChallengeFailed('no-snooze', daily({ snoozed: 1 }))).toBe(true)
    expect(isChallengeMet('no-snooze', daily({ added: 1, snoozed: 0 }))).toBe(true)
  })
})
