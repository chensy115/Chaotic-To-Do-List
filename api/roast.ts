import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolveRequestConfig } from './lib/serverConfig'

/**
 * Vercel Serverless 代理 — 支持服务端 ROAST_API_KEY 或客户端 BYOK
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

  const cfg = resolveRequestConfig(req)
  if (!cfg) {
    return res.status(401).json({ error: { message: '未配置 AI：请在 Vercel 设置 ROAST_API_KEY，或由用户填入 Key' } })
  }

  try {
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
    const payload: Record<string, unknown> = {
      model: cfg.model,
      messages: parsed.messages,
      max_tokens: parsed.max_tokens ?? 80,
      temperature: parsed.temperature ?? 0.85,
      stream: parsed.stream ?? false,
    }

    if (parsed.enable_thinking !== undefined) {
      payload.enable_thinking = parsed.enable_thinking
    }

    const upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
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
