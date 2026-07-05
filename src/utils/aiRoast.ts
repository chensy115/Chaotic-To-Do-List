import type { RoastContext } from '../types'
import {
  isQwenLike,
  isUserApiConfigured,
  loadApiConfig,
  canUseAi,
  resolveEffectiveApiConfig,
  type ApiConfig,
} from './apiConfig'
import { generateRoast } from './roastEngine'
import { buildRoastMessages } from './prompts'
import { cancelStreamText, streamText } from './streamText'
import { getServerAiStatus, fetchServerAiStatus } from './serverAi'
import { withTimeout } from './withTimeout'

const ROAST_TIMEOUT_MS = 45_000

export interface RoastResult {
  text: string
  source: 'ai' | 'local'
  error?: string
}

const THINKING_PLACEHOLDER = '🧠 深度思考中…（关深度思考可加速）'

function parseApiError(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as { error?: { message?: string } }).error
    if (err?.message) return err.message
  }
  if (status === 401) return 'API Key 无效或未授权'
  if (status === 429) return '请求太频繁，稍后再试'
  if (status === 402) return '账户余额不足'
  return `API 请求失败 (${status})`
}

function buildRequestBody(ctx: RoastContext, config: ApiConfig, stream: boolean) {
  const body: Record<string, unknown> = {
    messages: buildRoastMessages(ctx),
    // 中文 1–3 句常超过 80 token；过低会在句中硬截断
    max_tokens: ctx.event ? 100 : ctx.attemptCount > 1 ? 80 : 180,
    temperature: ctx.attemptCount > 1 ? 1.0 : 0.85,
    stream,
  }

  if (isQwenLike(config)) {
    body.enable_thinking = config.enableThinking
  }

  return body
}

interface SseDelta {
  content: string
  reasoning: string
}

function parseSseChunk(line: string): SseDelta {
  if (!line.startsWith('data: ')) return { content: '', reasoning: '' }
  const data = line.slice(6).trim()
  if (data === '[DONE]') return { content: '', reasoning: '' }
  try {
    const json = JSON.parse(data)
    const delta = json.choices?.[0]?.delta
    return {
      content: delta?.content ?? '',
      reasoning: delta?.reasoning_content ?? '',
    }
  } catch {
    return { content: '', reasoning: '' }
  }
}

function buildRoastHeaders(config: ApiConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (isUserApiConfigured(config)) {
    headers['X-API-Key'] = config.apiKey.trim()
    headers['X-API-Base-URL'] = config.baseUrl.replace(/\/$/, '')
    headers['X-API-Model'] = config.model.trim()
  }
  return headers
}

async function callRealApiStream(
  ctx: RoastContext,
  config: ApiConfig,
  onChunk: (text: string) => void
): Promise<RoastResult> {
  const res = await fetch('/api/roast', {
    method: 'POST',
    headers: buildRoastHeaders(config),
    body: JSON.stringify(buildRequestBody(ctx, config, true)),
  })

  if (!res.ok) {
    let data: unknown
    try {
      data = await res.json()
    } catch {
      throw new Error(`API 请求失败 (${res.status})`)
    }
    throw new Error(parseApiError(res.status, data))
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取流式响应')

  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''
  let sawReasoning = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const { content, reasoning } = parseSseChunk(line.trim())
      if (reasoning && !content) {
        sawReasoning = true
        onChunk(THINKING_PLACEHOLDER)
      }
      if (content) {
        full += content
        onChunk(full)
      }
    }
  }

  const text = full.trim()
  if (!text) {
    if (sawReasoning) {
      throw new Error('模型在深度思考但未返回正文，请在 AI 配置中关闭「深度思考」或换 qwen-flash')
    }
    throw new Error('API 返回内容为空')
  }

  return { text, source: 'ai' }
}

async function deliverLocalRoast(
  ctx: RoastContext,
  onChunk?: (text: string) => void
): Promise<RoastResult> {
  const text = generateRoast(ctx)
  if (onChunk) {
    await streamText(text, onChunk)
  }
  return { text, source: 'local' }
}

export async function getRoast(
  ctx: RoastContext,
  onChunk?: (text: string) => void
): Promise<RoastResult> {
  await fetchServerAiStatus()
  const serverAi = getServerAiStatus()
  const userConfig = loadApiConfig()
  const config = resolveEffectiveApiConfig(userConfig, serverAi)

  if (!canUseAi(userConfig, serverAi)) {
    return deliverLocalRoast(ctx, onChunk)
  }

  try {
    return await withTimeout(
      callRealApiStream(ctx, config, onChunk ?? (() => {})),
      ROAST_TIMEOUT_MS
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误'
    const result = await deliverLocalRoast(ctx, onChunk)
    return {
      ...result,
      error: ctx.event
        ? `AI 调用失败，已切换本地：${message}`
        : `AI 调用失败，已切换本地抬杠：${message}`,
    }
  }
}

/** 战场事件旁白（完成 / 甩锅）；默认本地，开启 fullAiMode 且已配置 AI 时走 API */
export async function getEventRoast(ctx: RoastContext): Promise<RoastResult> {
  cancelStreamText()
  await fetchServerAiStatus()
  const serverAi = getServerAiStatus()
  const userConfig = loadApiConfig()
  const useAi = canUseAi(userConfig, serverAi) && userConfig.fullAiMode && ctx.event

  if (!useAi) {
    return deliverLocalRoast({ ...ctx, attemptCount: 1 })
  }

  return getRoast({ ...ctx, attemptCount: 1 })
}

/** 测试 API 连通性 */
export async function testApiConnection(config: ApiConfig): Promise<{ ok: boolean; message: string }> {
  await fetchServerAiStatus()
  const serverAi = getServerAiStatus()
  const effective = resolveEffectiveApiConfig(config, serverAi)

  if (!canUseAi(config, serverAi)) {
    return { ok: false, message: '请先启用 AI，或在 Vercel 配置 ROAST_API_KEY' }
  }

  const t0 = performance.now()

  try {
    const res = await fetch('/api/roast', {
      method: 'POST',
      headers: buildRoastHeaders(effective),
      body: JSON.stringify({
        messages: [{ role: 'user', content: '回复一个字：好' }],
        max_tokens: 5,
        temperature: 0,
        stream: false,
        ...(isQwenLike(effective) ? { enable_thinking: false } : {}),
      }),
    })

    const data = await res.json()
    const ms = Math.round(performance.now() - t0)

    if (!res.ok) {
      return { ok: false, message: parseApiError(res.status, data) }
    }

    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return { ok: false, message: 'API 连通但返回为空' }
    return { ok: true, message: `连接成功 · ${ms}ms · 回复：${text}` }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : '连接失败',
    }
  }
}
