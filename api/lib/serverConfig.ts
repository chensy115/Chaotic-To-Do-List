/** 服务端 AI 配置（Vercel 环境变量 / 本地 .env） */
export function resolveServerConfig() {
  const apiKey = process.env.ROAST_API_KEY?.trim()
  if (!apiKey) return null

  return {
    apiKey,
    baseUrl: (process.env.ROAST_API_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, ''),
    model: (process.env.ROAST_API_MODEL || 'deepseek-chat').trim(),
    provider: (process.env.ROAST_PROVIDER || 'deepseek').trim(),
  }
}

export function resolveRequestConfig(req: {
  headers: Record<string, string | string[] | undefined>
}) {
  const clientKey = (req.headers['x-api-key'] as string | undefined)?.trim()
  const clientBase = (req.headers['x-api-base-url'] as string | undefined)?.replace(/\/$/, '')
  const clientModel = (req.headers['x-api-model'] as string | undefined)?.trim()

  if (clientKey) {
    return {
      apiKey: clientKey,
      baseUrl: clientBase || 'https://api.openai.com/v1',
      model: clientModel || 'gpt-4o-mini',
    }
  }

  const server = resolveServerConfig()
  if (!server) return null

  return {
    apiKey: server.apiKey,
    baseUrl: server.baseUrl,
    model: server.model,
  }
}
