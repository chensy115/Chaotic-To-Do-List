import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Vercel Serverless 代理 — 与 vite-plugin-roast-proxy 逻辑一致
 * 部署：将此文件放到 api/roast.ts，前端 build 后 deploy
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-API-Base-URL, X-API-Model')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  const apiKey = (req.headers['x-api-key'] as string | undefined)?.trim()
  const baseUrl = ((req.headers['x-api-base-url'] as string) || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = (req.headers['x-api-model'] as string) || 'gpt-4o-mini'

  if (!apiKey) {
    return res.status(401).json({ error: { message: '缺少 API Key' } })
  }

  try {
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
    const payload: Record<string, unknown> = {
      model,
      messages: parsed.messages,
      max_tokens: parsed.max_tokens ?? 80,
      temperature: parsed.temperature ?? 0.85,
      stream: parsed.stream ?? false,
    }

    if (parsed.enable_thinking !== undefined) {
      payload.enable_thinking = parsed.enable_thinking
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (payload.stream && upstream.ok && upstream.body) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      const reader = upstream.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
      return res.end()
    }

    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', 'application/json')
    return res.send(text)
  } catch (err) {
    return res.status(502).json({
      error: { message: err instanceof Error ? err.message : '代理请求失败' },
    })
  }
}
