import type { RoastContext } from '../types'
import { loadApiConfig } from './apiConfig'
import { applyPersonalityLocal } from './personality'

const KEYWORD_ROASTS: Array<{ pattern: RegExp; roasts: string[] }> = [
  {
    pattern: /背单词|单词|英语|雅思|托福|四六级|考研/i,
    roasts: [
      '大晚上的背什么单词？你昨天背的今天还记得吗？abandon 还是 abandon 吧。',
      '你的词汇量：abandon, abandon, abandon… 建议直接放弃，这个词你背得最熟。',
      '买过的单词 App 够开博物馆了，哪一个你坚持超过三天了？',
    ],
  },
  {
    pattern: /健身|跑步|运动|锻炼|瑜伽|撸铁|去 gym/i,
    roasts: [
      '健身卡办了半年，去了一次洗澡，今天又想动了？',
      '你的运动计划：收藏健身视频 → 躺着看 → 等于练了。今天也走这个流程？',
      '上次说「明天开始」是哪天来着？哦对，每个明天。',
    ],
  },
  {
    pattern: /学习|看书|复习|刷题|写作业|论文/i,
    roasts: [
      '摸鱼摸了一下午，现在突然想学习了？太阳打西边出来了。',
      '书买了很多，塑封还在。你是收藏家，不是读书人。',
      'deadline 还有三天？那你现在加这个任务，说明还有… 哦，已经来不及了。',
    ],
  },
  {
    pattern: /早起|闹钟|6点|七点|晨练/i,
    roasts: [
      '你上次早起成功，还是上次。再上次？没有上次。',
      '设了 10 个闹钟，每一个都被你按掉然后继续睡。今天会不一样？我不信。',
      '早起毁一天，不如睡到自然醒，梦里什么都有。',
    ],
  },
  {
    pattern: /减肥|节食|少吃|戒糖|戒奶茶/i,
    roasts: [
      '奶茶下单的手速，可比减肥快多了。别骗自己了。',
      '「最后一次」你已经说了 47 次了，我数着呢。',
      '减肥最好的方法就是：不要开始。你已经很完美了（指圆润）。',
    ],
  },
  {
    pattern: /加班|工作|开会|汇报|ppt/i,
    roasts: [
      '明明可以明天摸鱼，为什么要今天卷？老板又不会给你发锦旗。',
      'PPT 改到第几版了？第 18 版和第 1 版有区别吗？',
      '加班不会让你的工资变多，但会让你的头发变少。划算吗？',
    ],
  },
  {
    pattern: /打扫|收拾|整理|洗碗|拖地|洗衣服/i,
    roasts: [
      '乱了一周了，今天突然有洁癖了？房间会自己理解你的。',
      '「等下就收拾」—— 等下是哪天？',
      '你的收纳哲学：眼不见为净。继续保持，别打破传统。',
    ],
  },
  {
    pattern: /喝水|八杯水|养生/i,
    roasts: [
      '你今天的饮水量：咖啡 3 杯，奶茶 1 杯，水 0 杯。养生？',
      '保温杯里泡枸杞，熬夜熬到两三点。这很矛盾你知道吗？',
    ],
  },
  {
    pattern: /冥想|正念|打坐/i,
    roasts: [
      '冥想 5 分钟，刷手机 50 分钟。你的正念在哪里？',
      '坐着不动对你来说已经是极限挑战了，还要冥想？',
    ],
  },
]

const TIME_ROASTS: Array<{ test: (h: number) => boolean; roasts: string[] }> = [
  {
    test: (h) => h >= 23 || h < 5,
    roasts: [
      '这个点了还不睡？你加任务是为了感动自己吗？不如去睡觉。',
      '凌晨了，你的任务清单和你的头发一样，越加越多，越掉越快。',
      '深夜生产力？骗谁呢。你只是在焦虑地假装努力。',
    ],
  },
  {
    test: (h) => h >= 22 && h < 23,
    roasts: [
      '十点了还想搞事情？明天的事明天再说，今天已经够累了（摸鱼也是累）。',
      '大晚上的，你的大脑已经下班了，只有手还在倔强地打字。',
    ],
  },
  {
    test: (h) => h >= 12 && h < 14,
    roasts: [
      '中午了，这个时间段最该做的是午睡，不是加待办。',
      '饭后百步走，活到… 算了，你先躺会儿吧。',
    ],
  },
  {
    test: (h) => h >= 18 && h < 20,
    roasts: [
      '饭点到了，人是铁饭是钢，先吃饭再画饼。',
      '下班后的黄金时间，你居然想用来「上进」？叛逆了属于是。',
    ],
  },
]

const GENERIC_ROASTS = [
  '你这个任务，我赌五毛，三天后在列表里原封不动。',
  'Todo List 不是许愿池，加了也不会自动完成的。',
  '你的执行力：⬜⬜⬜⬜⬜ 0%。但你的计划力：██████████ 100%。',
  '建议把这个任务改成「躺着」，成功率 100%。',
  '不是打击你，是基于历史数据的科学预测。',
  '你已经有 {count} 个待办了，再加一个？列表不会自己变短的。',
  '「明天做」—— 人类历史上最成功的拖延策略，没有之一。',
  'Adding task… Error: Motivation not found.',
  '检测到自我感动行为，已自动拦截。',
  '你的待办清单：梦想很丰满，执行很骨感。',
]

const PERSIST_ROASTS = [
  '行，你头真铁。但别怪我没提醒你。',
  '非要加？好吧，但完成率我帮你记着呢，到时候别哭。',
  '你赢了这一局，但任务不会因此变简单。',
  '加吧加吧，反正逃跑按钮不会放过你的。',
]

const DUPLICATE_ROASTS = [
  '你又来了？这个任务你加过吧，记忆只有七秒？',
  '似曾相识的任务出现了——上次那个还在列表里躺着呢。',
  '复读机是吧？同一个饼画两次不会更香。',
  '检测到 duplicate 行为：你的待办不是 Ctrl+C Ctrl+V。',
]

const STACK_ROASTS = [
  '待办已经堆成山了，加一个不会 magically 消失一个。',
  '{count} 个待办在看着你，你还有脸再加？',
  '清单都快溢出屏幕了，你是来搞收藏的不是来做事的。',
  '加更多任务不会让前面的自动完成，醒醒。',
]

const SNOOZE_HABIT_ROASTS = [
  '甩锅惯犯还加任务？先把旧账清了吧。',
  '累计甩锅 {snoozes} 次，你的「明日」永远不来。',
  '你甩锅的技术比完成任务熟练多了。',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 归一化任务文本，用于重复检测 */
export function normalizeTaskText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，。！？、；：""''（）【】]/g, '')
}

/** 是否与已有任务重复（包含关系或高度相似） */
export function isDuplicateTask(task: string, existingTasks: string[]): boolean {
  const norm = normalizeTaskText(task)
  if (norm.length < 2) return false
  return existingTasks.some((existing) => {
    const e = normalizeTaskText(existing)
    if (e === norm) return true
    if (norm.length >= 2 && e.length >= 2) {
      return e.includes(norm) || norm.includes(e)
    }
    return false
  })
}

function matchKeyword(task: string): string | null {
  for (const { pattern, roasts } of KEYWORD_ROASTS) {
    if (pattern.test(task)) return pick(roasts)
  }
  return null
}

function matchTime(hour: number): string | null {
  for (const { test, roasts } of TIME_ROASTS) {
    if (test(hour)) return pick(roasts)
  }
  return null
}

export function generateRoast(ctx: RoastContext): string {
  const personality = loadApiConfig().personality
  let text: string

  if (ctx.event === 'complete') {
    text = generateCompletionRoast(ctx.escapeCount ?? 0)
  } else if (ctx.event === 'snooze') {
    text = generateSnoozeTaunt(ctx)
  } else if (ctx.attemptCount > 1) {
    text = pick(PERSIST_ROASTS)
  } else if (isDuplicateTask(ctx.task, ctx.existingTasks)) {
    text = pick(DUPLICATE_ROASTS)
  } else {
    const activeCount = ctx.activeTaskCount ?? ctx.existingTasks.length
    if (activeCount >= 5 && Math.random() > 0.35) {
      text = pick(STACK_ROASTS).replace('{count}', String(activeCount))
    } else if ((ctx.totalSnoozes ?? 0) >= 3 && Math.random() > 0.5) {
      text = pick(SNOOZE_HABIT_ROASTS).replace('{snoozes}', String(ctx.totalSnoozes))
    } else {
      const keyword = matchKeyword(ctx.task)
      const timeBased = matchTime(ctx.hour)

      if (keyword && timeBased && Math.random() > 0.5) {
        text = `${timeBased} ${keyword}`
      } else if (keyword) {
        text = keyword
      } else if (timeBased) {
        text = timeBased
      } else {
        const generic = pick(GENERIC_ROASTS)
        text = generic.replace('{count}', String(ctx.existingTasks.length))
      }
    }
  }

  return applyPersonalityLocal(text, personality)
}

const SNOOZE_TAUNTS = [
  '又甩锅？画饼指数默默 +1。',
  '明日复明日，明日何其多——你懂的。',
  '甩锅成功，任务继续腐烂，你继续心安理得。',
  '好的，明天见（骗你的）。',
  '这一脚踢给未来的你，它一定会感谢你的。',
]

export function generateSnoozeTaunt(ctx: RoastContext): string {
  const base = pick(SNOOZE_TAUNTS)
  if (ctx.snoozeExcuse) {
    return `${base} 借口：${ctx.snoozeExcuse}`
  }
  return base
}

export function generateCompletionRoast(escapeCount: number): string {
  if (escapeCount === 0) return '一次就抓到了？你是不是开了挂…'
  if (escapeCount < 5) return `逃了 ${escapeCount} 次还是被逮到了，认命吧。`
  if (escapeCount < 15) return `${escapeCount} 次！你的毅力要是用在正事上早成功了。`
  return `逃了 ${escapeCount} 次… 我服了，这任务对你来说确实太难了，算你完成。`
}

export const ESCAPE_TAUNTS = [
  '想完成？做梦！',
  '抓不到吧～',
  '手速不够哦',
  '再快点！',
  '略略略',
  '你追啊',
  '摸不到～',
  '继续加油（对我没用）',
]
