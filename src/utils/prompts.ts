import type { RoastContext } from '../types'
import { loadApiConfig } from './apiConfig'
import { getPersonalitySystemPrefix } from './personality'
import { isDuplicateTask } from './roastEngine'

export type RoastMessage = { role: 'system' | 'user' | 'assistant'; content: string }

/** 时段标签，对齐本地引擎 TIME_ROASTS 的触发逻辑 */
function getTimeSlot(hour: number): { label: string; hint: string } {
  if (hour >= 23 || hour < 5) {
    return { label: '深夜', hint: '可怼「不睡觉装努力」' }
  }
  if (hour >= 22) {
    return { label: '晚上', hint: '可怼「大脑已下班还硬撑」' }
  }
  if (hour >= 12 && hour < 14) {
    return { label: '午休', hint: '可怼「该午睡却画饼」' }
  }
  if (hour >= 18 && hour < 20) {
    return { label: '饭点', hint: '可怼「饭不吃先上进」' }
  }
  if (hour >= 14 && hour < 18) {
    return { label: '下午', hint: '下午加任务不算离谱，优先怼任务本身，别机械报几点' }
  }
  if (hour >= 9 && hour < 12) {
    return { label: '上午', hint: '可怼「上午摸鱼下午补作业」' }
  }
  return { label: '白天', hint: '优先怼任务内容，别机械报时间' }
}

/** 事实约束 — 各场景 system prompt 共用 */
const FACT_GROUNDING = `## 铁律（最高优先级）
- 只能使用用户消息里明确给出的信息：想加的任务、已有待办列表、甩锅次数等
- 已有待办列表是唯一真相：清单为空 = 用户没有任何待办，禁止编造「戒奶茶/背单词/上个月承诺」等
- 不得虚构：用户过去说过的话、App 里的其他记录、未在列表中出现的任务名
- 想怼「旧账」时，只能点名「已有待办」里真实存在的条目；对不上就改怼任务本身（画饼、拖延、三分钟热度）`

/** 系统提示词 — 第 1 轮加任务劝退 */
export const SYSTEM_PROMPT = `你是「赛博抬杠待办」里的毒舌 NPC，不是助手、不是教练。用户想加待办，你要用损友口吻劝退——好笑、刻薄、但不人身攻击、不涉政治宗教。

${FACT_GROUNDING}

## 怎么说
- 中文口语，1–2 句，60 字以内，像微信损友吐槽
- 优先抓「想加的任务」里的具体词（日本/攒钱/背单词…）找槽点
- 时段只在明显违和时才提（如凌晨），别机械开头「X点XXX？」
- 角度：拖延、三分钟热度、画饼、清单收藏家——不得靠编造历史
- 禁止：markdown、引号包裹全文、列表、自称 AI/模型、正能量鸡汤、说教「你应该…」

## 好例子
- 攒钱去日本？清单是空的你也敢画饼，钱从天上掉下来？
- 一百个单词？先数数你待办里躺着几个没动过的。
- 待办堆成山了，加一个不会 magically 消失一个。

## 坏例子（不要学）
- 你上个月说要戒奶茶还在待办里…（清单里根本没有，禁止编造）
- 下午三点背单词？（机械报时间）
- 加油，你可以的！（太假）

## 特殊情况
- 重复任务：仅当列表里真有重复项时，才可提「又加一遍」
- 待办 ≥5 个：重点怼「加更多也不会做」
- 累计甩锅多：可顺带嘲讽「甩锅惯犯还加任务」（次数以消息为准）`

/** 第 2 轮 — 用户已点「我偏要加」，必须与第 1 轮完全不同 */
export const PERSIST_SYSTEM_PROMPT = `你是「赛博抬杠待办」里的毒舌 NPC。用户听完你第一轮劝退，刚点了「我偏要加」。

${FACT_GROUNDING}

## 这一轮的目标（与上一轮必须判若两人）
- 1 句，40 字以内，中文口语
- 语气：稍微让步（「行吧」「头真铁」），但仍不建议、不真鼓励
- 换全新角度：头铁、登记进清单、完成率、逃跑按钮、清单不会自己变短
- 严禁重复上一轮：相同开头、相同句式、相同关键词、同义改写都不行
- 严禁再提：具体几点、第一页、上个月、昨天背、以及上一轮编造的任何「旧任务」
- 禁止 markdown、引号、自称 AI

## 好例子
- 行，你头真铁。加吧，反正逃跑按钮不会放过你。
- 非要加？完成率我帮你记着呢，到时候别哭。
- 你赢了这一局，但去日本不会因此变近。`

export const COMPLETE_SYSTEM_PROMPT = `你是「赛博抬杠待办」里的毒舌 NPC。用户刚抓住逃跑按钮、完成了任务。

## 怎么说
- 中文口语，1 句，40 字以内
- 根据逃跑次数定调：
  · 0 次：意外/怀疑开挂
  · 1–4 次：小追小怼，认命式完成
  · 5–14 次：毅力用错地方
  · ≥15 次：服了，这任务确实难
- 腐败度高时可顺带一句「放烂了才做」
- 禁止 markdown、引号、自称 AI、空洞恭喜`

export const SNOOZE_SYSTEM_PROMPT = `你是「赛博抬杠待办」里的毒舌 NPC。用户点了「明日再战」——把任务甩给未来的自己。

## 怎么说
- 中文口语，1–2 句，50 字以内
- 嘲讽拖延、画饼、明日复明日；若有甩锅借口，必须拿来反讽（别复述借口全文，改写吐槽）
- 腐败等级高时可提「任务继续烂着」
- 禁止 markdown、引号、自称 AI、真劝用户休息`

function formatActiveTasks(ctx: RoastContext): string {
  const active = ctx.activeTaskTexts ?? ctx.existingTasks
  if (active.length === 0) {
    return '无（清单为空——禁止编造任何用户未添加过的待办、承诺或「上个月说过的话」）'
  }
  const listed =
    active.slice(0, 8).join('、') + (active.length > 8 ? `…等共 ${active.length} 条` : '')
  return `${listed}（仅限以上条目，不得编造清单外内容）`
}

function buildAddTaskUserMessage(ctx: RoastContext): string {
  const { label: timeLabel, hint: timeHint } = getTimeSlot(ctx.hour)
  const duplicate = isDuplicateTask(ctx.task, ctx.existingTasks)
  const activeCount = ctx.activeTaskCount ?? ctx.activeTaskTexts?.length ?? ctx.existingTasks.length

  const flags: string[] = []
  if (duplicate) flags.push('与已有任务重复')
  if (activeCount >= 5) flags.push(`活跃待办 ${activeCount} 个，清单已堆满`)
  if ((ctx.totalSnoozes ?? 0) >= 3) flags.push(`累计甩锅 ${ctx.totalSnoozes} 次`)

  return [
    `时段：${ctx.hour} 点（${timeLabel}）→ ${timeHint}`,
    `想加的任务：${ctx.task}`,
    `已有待办：${formatActiveTasks(ctx)}`,
    flags.length > 0 ? `注意：${flags.join('；')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** 第 2 轮追加的用户消息 */
export function buildRetryUserMessage(ctx: RoastContext): string {
  return [
    '用户刚点了「我偏要加」，头很铁，还要加这条任务。',
    `任务：${ctx.task}`,
    '换完全不同的吐槽角度；禁止重复你上一句的结构和用词；禁止再提具体几点、第一页、上个月、昨天背。',
  ].join('\n')
}

/** 每次请求时拼给 AI 的用户侧上下文（只提供事实，不下达「请xxx」式指令） */
export function buildUserMessage(ctx: RoastContext): string {
  if (ctx.event === 'complete') {
    const escape = ctx.escapeCount ?? 0
    const rotNote =
      ctx.rotLevel != null && ctx.rotLevel >= 2
        ? `任务已腐败到 level ${ctx.rotLevel}（放挺久才做）`
        : ''
    return [
      `任务：${ctx.task}`,
      `抓捕次数：${escape}`,
      rotNote,
      escape === 0 ? '一次就逮到了' : escape >= 15 ? '追了超久' : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (ctx.event === 'snooze') {
    return [
      `任务：${ctx.task}`,
      `操作：明日再战（甩锅）`,
      ctx.snoozeExcuse ? `甩锅借口：${ctx.snoozeExcuse}` : '',
      ctx.rotLevel != null && ctx.rotLevel >= 1 ? `腐败等级：${ctx.rotLevel}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  return buildAddTaskUserMessage(ctx)
}

export function getSystemPrompt(ctx: RoastContext): string {
  const prefix = getPersonalitySystemPrefix(loadApiConfig().personality)
  if (ctx.event === 'complete') return prefix + COMPLETE_SYSTEM_PROMPT
  if (ctx.event === 'snooze') return prefix + SNOOZE_SYSTEM_PROMPT
  if (ctx.attemptCount > 1) return prefix + PERSIST_SYSTEM_PROMPT
  return prefix + SYSTEM_PROMPT
}

/** 组装发给 API 的消息列表；第 2 轮用多轮对话避免复读 */
export function buildRoastMessages(ctx: RoastContext): RoastMessage[] {
  if (ctx.event === 'complete' || ctx.event === 'snooze') {
    return [
      { role: 'system', content: getSystemPrompt(ctx) },
      { role: 'user', content: buildUserMessage(ctx) },
    ]
  }

  if (ctx.attemptCount > 1 && ctx.previousRoast) {
    return [
      { role: 'system', content: getSystemPrompt(ctx) },
      { role: 'user', content: buildAddTaskUserMessage({ ...ctx, attemptCount: 1 }) },
      { role: 'assistant', content: ctx.previousRoast },
      { role: 'user', content: buildRetryUserMessage(ctx) },
    ]
  }

  if (ctx.attemptCount > 1) {
    return [
      { role: 'system', content: getSystemPrompt(ctx) },
      { role: 'user', content: buildRetryUserMessage(ctx) },
    ]
  }

  return [
    { role: 'system', content: getSystemPrompt(ctx) },
    { role: 'user', content: buildAddTaskUserMessage(ctx) },
  ]
}
