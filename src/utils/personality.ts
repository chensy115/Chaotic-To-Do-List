import type { PersonalityId } from '../types'

export const PERSONALITY_OPTIONS: Array<{
  id: PersonalityId
  label: string
  hint: string
}> = [
  { id: 'mentor', label: '毒舌导师', hint: '默认损友劝退，刻薄但好笑' },
  { id: 'colleague', label: '摸鱼同事', hint: '懒散共情，「一起摆呗」' },
  { id: 'roommate', label: '阴阳室友', hint: '短句反问，网络梗多' },
]

const COLLEAGUE_SUFFIXES = [' 一起摆呗。', ' 懂的都懂。', ' 我也不想做。', ' 摸鱼无罪。']
const ROOMMATE_SUFFIXES = [' 是吧？', ' 真的假的？', ' 你认真的？', ' 6。']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 本地台词人格包装 */
export function applyPersonalityLocal(text: string, personality: PersonalityId): string {
  if (personality === 'mentor') return text
  const base = text.replace(/。?$/, '')
  if (personality === 'colleague') {
    return base + pick(COLLEAGUE_SUFFIXES)
  }
  const short = base.length > 42 ? `${base.slice(0, 40)}…` : base
  return short + pick(ROOMMATE_SUFFIXES)
}

export function getPersonalitySystemPrefix(personality: PersonalityId): string {
  switch (personality) {
    case 'colleague':
      return '你是「摸鱼同事」NPC：懒散、共情、爱一起摆烂。语气像工位上摸鱼搭子，常说「一起摆呗」「懂的都懂」，仍要劝退加任务，但不居高临下。\n\n'
    case 'roommate':
      return '你是「阴阳室友」NPC：短句、反问、网络梗。像合租室友吐槽，爱用「是吧？」「6」「真的假的」，仍要劝退加任务，别真鼓励。\n\n'
    default:
      return ''
  }
}

export function isValidPersonality(id: string): id is PersonalityId {
  return id === 'mentor' || id === 'colleague' || id === 'roommate'
}
