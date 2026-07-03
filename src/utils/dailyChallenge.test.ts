import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  checkChallengeComplete,
  getOrCreateDailyChallenge,
  markChallengeDone,
  pickChallengeReward,
} from './dailyChallenge'
import { bumpDailyStat, loadDailyStats } from './dailyStats'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
})

describe('getOrCreateDailyChallenge', () => {
  it('returns stable challenge for same day', () => {
    const a = getOrCreateDailyChallenge()
    const b = getOrCreateDailyChallenge()
    expect(a.id).toBe(b.id)
    expect(a.title).toBe(b.title)
  })
})

describe('checkChallengeComplete', () => {
  it('completes one-reject when rejected bumped', () => {
    const challenge = getOrCreateDailyChallenge()
    Object.defineProperty(challenge, 'id', { value: 'one-reject' })
    const daily = bumpDailyStat('rejected')
    expect(checkChallengeComplete(challenge, daily)).toBe(true)
  })

  it('marks done in storage', () => {
    const challenge = getOrCreateDailyChallenge()
    const done = markChallengeDone(challenge)
    expect(done.done).toBe(true)
  })
})

describe('pickChallengeReward', () => {
  it('returns non-empty string', () => {
    expect(pickChallengeReward('2026-07-03').length).toBeGreaterThan(5)
  })
})

describe('loadDailyStats', () => {
  it('starts at zero for new day', () => {
    const stats = loadDailyStats()
    expect(stats.added).toBe(0)
    expect(stats.snoozed).toBe(0)
  })
})
