import type { PersonalityId } from '../types'
import type { ServerAiStatus } from './serverAi'
import { isValidPersonality } from './personality'

export type ApiProvider = 'openai' | 'deepseek' | 'qwen' | 'moonshot' | 'custom'

export interface ApiConfig {
  enabled: boolean
  provider: ApiProvider
  apiKey: string
  baseUrl: string
  model: string
  /** 通义 Qwen3 等模型的深度思考，默认关（关=c 快） */
  enableThinking: boolean
  /** 完成 / 甩锅场景也走 AI（更耗 Key） */
  fullAiMode: boolean
  /** NPC 人格档位 */
  personality: PersonalityId
}

const STORAGE_KEY = 'chaotic-api-config'

export const PROVIDER_PRESETS: Record<
  Exclude<ApiProvider, 'custom'>,
  { label: string; baseUrl: string; model: string; hint: string }
> = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    hint: 'platform.openai.com 获取 Key',
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    hint: 'platform.deepseek.com 获取 Key',
  },
  qwen: {
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-flash',
    hint: '推荐 qwen-flash（快）或 qwen-plus；qwen-max 较慢',
  },
  moonshot: {
    label: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    hint: 'platform.moonshot.cn 获取 Key',
  },
}

const DEFAULT_CONFIG: ApiConfig = {
  enabled: false,
  provider: 'deepseek',
  apiKey: '',
  baseUrl: PROVIDER_PRESETS.deepseek.baseUrl,
  model: PROVIDER_PRESETS.deepseek.model,
  enableThinking: false,
  fullAiMode: false,
  personality: 'mentor',
}

function fromEnv(): Partial<ApiConfig> {
  const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (!key?.trim()) return {}

  return {
    enabled: true,
    provider: 'custom',
    apiKey: key.trim(),
    baseUrl: ((import.meta.env.VITE_OPENAI_BASE_URL as string) || 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: ((import.meta.env.VITE_OPENAI_MODEL as string) || 'gpt-4o-mini').trim(),
  }
}

export function loadApiConfig(): ApiConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(saved) } as ApiConfig
      return {
        ...parsed,
        baseUrl: parsed.baseUrl.replace(/\/$/, ''),
        enableThinking: parsed.enableThinking ?? false,
        fullAiMode: parsed.fullAiMode ?? false,
        personality: isValidPersonality(parsed.personality) ? parsed.personality : 'mentor',
      }
    }
  } catch {
    // ignore
  }

  const env = fromEnv()
  if (env.apiKey) {
    return { ...DEFAULT_CONFIG, ...env, enabled: true }
  }

  return DEFAULT_CONFIG
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...config, baseUrl: config.baseUrl.replace(/\/$/, '') })
  )
}

export function isUserApiConfigured(config: ApiConfig): boolean {
  return config.enabled && !!config.apiKey.trim() && !!config.baseUrl.trim() && !!config.model.trim()
}

/** @deprecated 使用 canUseAi */
export function isApiConfigured(config: ApiConfig): boolean {
  return isUserApiConfigured(config)
}

/** 服务端托管或用户自配 Key 时均可使用 AI */
export function canUseAi(config: ApiConfig, serverAi?: ServerAiStatus | null): boolean {
  if (serverAi?.available) return config.enabled
  if (!config.enabled) return false
  return isUserApiConfigured(config)
}

/** 托管 AI 是否仍在检测中（避免误显示「本地抬杠」） */
export function isServerAiPending(serverAi: ServerAiStatus | null | undefined): boolean {
  return serverAi === null || serverAi === undefined
}

/** 合并服务端与用户配置，供请求头 / Qwen 判断使用 */
export function resolveEffectiveApiConfig(
  config: ApiConfig,
  serverAi?: ServerAiStatus | null
): ApiConfig {
  if (isUserApiConfigured(config)) return config
  if (!serverAi?.available) return config

  return {
    ...config,
    enabled: true,
    provider: 'custom',
    apiKey: '',
    baseUrl: serverAi.baseUrl || PROVIDER_PRESETS.deepseek.baseUrl,
    model: serverAi.model || PROVIDER_PRESETS.deepseek.model,
  }
}

export function aiProviderLabel(config: ApiConfig, serverAi?: ServerAiStatus | null): string {
  if (isUserApiConfigured(config)) {
    return config.provider === 'custom' ? config.model : config.provider
  }
  if (serverAi?.available) {
    return serverAi.provider || serverAi.model || '托管'
  }
  return '本地'
}

export function applyProviderPreset(provider: ApiProvider, current: ApiConfig): ApiConfig {
  if (provider === 'custom') return { ...current, provider }
  const preset = PROVIDER_PRESETS[provider]
  return {
    ...current,
    provider,
    baseUrl: preset.baseUrl,
    model: preset.model,
  }
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}••••${key.slice(-4)}`
}

export function isQwenLike(config: Pick<ApiConfig, 'baseUrl' | 'model' | 'provider'>): boolean {
  const hay = `${config.provider} ${config.baseUrl} ${config.model}`.toLowerCase()
  return hay.includes('qwen') || hay.includes('dashscope')
}

export function isSlowQwenModel(model: string): boolean {
  const m = model.toLowerCase()
  return /max|235b|72b|thinking|plus-2025/.test(m)
}
