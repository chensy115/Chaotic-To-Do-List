export interface Task {
  id: string
  text: string
  createdAt: number
  completed: boolean
  roast?: string
  escapeCount?: number
  snoozeCount?: number
  lastSnoozeExcuse?: string
  completionRoast?: string
  completedAt?: number
}

export type RoastEvent = 'add' | 'complete' | 'snooze'

export type PersonalityId = 'colleague' | 'mentor' | 'roommate'

export type TimelineKind = 'user' | 'roast' | 'report' | 'task_added' | 'task_done' | 'task_snooze'

export interface TimelineEntry {
  id: string
  at: number
  kind: TimelineKind
  text: string
  taskId?: string
  meta?: Record<string, unknown>
}

export interface RoastContext {
  task: string
  hour: number
  attemptCount: number
  existingTasks: string[]
  /** 未完成的待办文案，供 AI 引用（不得编造清单外任务） */
  activeTaskTexts?: string[]
  activeTaskCount?: number
  totalSnoozes?: number
  event?: RoastEvent
  escapeCount?: number
  rotLevel?: number
  snoozeExcuse?: string
  /** 上一轮 AI 劝退台词（第 2 次添加时传入，避免复读） */
  previousRoast?: string
}

export interface Stats {
  rejected: number
  escaped: number
  completed: number
  snoozed: number
  /** 使用「认命完成」的次数 */
  surrendered?: number
}

export type RotLevel = 0 | 1 | 2 | 3 | 4

export interface TaskRot {
  level: RotLevel
  label: string
  emoji: string
  ageHours: number
  rotPercent: number
  /** 逃跑感应半径加成 */
  fleeRadius: number
  /** 竞技场高度加成 */
  arenaHeight: number
  taunt: string
}
