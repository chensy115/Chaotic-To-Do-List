import type { TaskRot, RotLevel } from '../types'

const ROT_STAGES: Array<Omit<TaskRot, 'level' | 'ageHours' | 'rotPercent'>> = [
  {
    label: '新鲜画饼',
    emoji: '🥞',
    fleeRadius: 90,
    arenaHeight: 100,
    taunt: '刚加的就想完成？太急了。',
  },
  {
    label: '微妙变质',
    emoji: '😐',
    fleeRadius: 110,
    arenaHeight: 110,
    taunt: '放了一阵子了，你也知道不会做的对吧？',
  },
  {
    label: '明显发霉',
    emoji: '🍄',
    fleeRadius: 130,
    arenaHeight: 125,
    taunt: '这任务都发霉了，建议直接扔。',
  },
  {
    label: '深度腐烂',
    emoji: '☠️',
    fleeRadius: 155,
    arenaHeight: 140,
    taunt: '腐烂到这种程度，完成它算考古。',
  },
  {
    label: '赛博化石',
    emoji: '🦴',
    fleeRadius: 180,
    arenaHeight: 155,
    taunt: '这任务比你的毅力还古老。',
  },
]

function levelFromHours(h: number): RotLevel {
  if (h < 6) return 0
  if (h < 24) return 1
  if (h < 72) return 2
  if (h < 168) return 3
  return 4
}

function rotPercent(h: number, level: RotLevel): number {
  const thresholds = [6, 24, 72, 168, 336]
  const min = level === 0 ? 0 : thresholds[level - 1]
  const max = thresholds[level]
  return Math.min(100, Math.round(((h - min) / (max - min)) * 100))
}

export function getTaskRot(createdAt: number): TaskRot {
  const ageHours = (Date.now() - createdAt) / 3_600_000
  const level = levelFromHours(ageHours)
  const base = ROT_STAGES[level]

  return {
    level,
    ageHours,
    rotPercent: rotPercent(ageHours, level),
    ...base,
  }
}

export function getRotClass(level: RotLevel): string {
  return `task-rot-${level}`
}

export const BOSS_TAUNTS = [
  'Boss 战：这任务已是赛博化石，你还想完成？',
  '腐败领主降临：逃跑按钮今天特别精神。',
  '化石级任务：考古学家看了都摇头。',
  '这烂程度，完成它算重大考古发现。',
  '按钮说：今天你也别想抓到我。',
]

export function pickBossTaunt(index = 0): string {
  return BOSS_TAUNTS[index % BOSS_TAUNTS.length]
}
