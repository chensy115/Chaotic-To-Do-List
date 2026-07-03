import type { DailyStats } from './dailyStats'
import { isChallengeMet } from './dailyStats'

export interface DailyChallenge {
  date: string
  id: string
  title: string
  done: boolean
}

const CHALLENGE_KEY = 'chaotic-daily-challenge-v1'

const CHALLENGE_POOL: Array<{ id: string; title: string }> = [
  { id: 'no-snooze', title: '今日禁止甩锅' },
  { id: 'one-add', title: '今日只加 1 条任务' },
  { id: 'one-done', title: '今日必须完成 1 条' },
  { id: 'one-reject', title: '今日劝退一次（点好吧算了）' },
]

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function loadDailyChallenge(): DailyChallenge | null {
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DailyChallenge
    if (!parsed || parsed.date !== todayKey()) return null
    return parsed
  } catch {
    return null
  }
}

export function getOrCreateDailyChallenge(): DailyChallenge {
  const existing = loadDailyChallenge()
  if (existing) return existing

  const date = todayKey()
  const idx = hashSeed(date) % CHALLENGE_POOL.length
  const picked = CHALLENGE_POOL[idx]
  const challenge: DailyChallenge = { date, id: picked.id, title: picked.title, done: false }
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge))
  return challenge
}

export function checkChallengeComplete(challenge: DailyChallenge, daily: DailyStats): boolean {
  return isChallengeMet(challenge.id, daily)
}

export function markChallengeDone(challenge: DailyChallenge): DailyChallenge {
  const done = { ...challenge, done: true }
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(done))
  return done
}

export const CHALLENGE_REWARDS = [
  '挑战完成！奖励：什么都没有，但你赢了自己（大概）。',
  '今日挑战达成。系统判定：你居然做到了，可疑。',
  '行吧，今天这一局你赢了。明天继续摆。',
]

export function pickChallengeReward(seed: string): string {
  const idx = hashSeed(seed) % CHALLENGE_REWARDS.length
  return CHALLENGE_REWARDS[idx]
}
