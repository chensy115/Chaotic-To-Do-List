import type { TaskRot } from '../types'

const EXCUSES = [
  '今天能量只够呼吸，这个任务自动顺延到平行宇宙。',
  '经 AI 精密计算，今天做这件事的成功率为 3.7%，建议放弃。',
  '你现在的状态适合刷手机，不适合干活，这是科学。',
  '任务收到了，但我的建议是：先点个外卖奖励自己。',
  '明天你有 24 小时，今天只有剩下的几小时，不公平。',
  '这个任务需要「整块时间」，你现在只有「碎片摸鱼」。',
  '已帮你写入日程：「某个以后」。具体哪天别问。',
  '不是不做，是时机未到。时机永远未到。',
]

const ROT_EXCUSES: Record<number, string[]> = {
  2: ['都发霉了，再晾晾也没差。', '多放一天更入味（指任务腐败）。'],
  3: ['腐烂成这样，不如当没看见。', '考古学家都没你拖得久。'],
  4: ['这任务已经是文物了，不宜轻举妄动。', '化石级任务建议捐给博物馆。'],
}

export function generateSnoozeExcuse(taskText: string, rot: TaskRot): string {
  const rotSpecific = ROT_EXCUSES[rot.level]
  if (rotSpecific && Math.random() > 0.4) {
    return rotSpecific[Math.floor(Math.random() * rotSpecific.length)]
  }

  if (/健身|跑步|运动/i.test(taskText)) {
    return '今天肌肉在罢工，已帮你请假。'
  }
  if (/学习|看书|复习/i.test(taskText)) {
    return '大脑：已关机。任务：已休眠。'
  }
  if (/早起/i.test(taskText)) {
    return '明天的你会感谢今天没折磨自己的决定。'
  }

  return EXCUSES[Math.floor(Math.random() * EXCUSES.length)]
}
