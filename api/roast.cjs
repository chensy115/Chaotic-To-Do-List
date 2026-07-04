const { resolveRequestConfig, readBody } = require('./_shared.cjs')

/** Vercel Serverless 代理 — 支持服务端 ROAST_API_KEY 或客户端 BYOK */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-API-Base-URL, X-API-Model')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: { message: 'Method not allowed' } }))
    return
  }

  const cfg = resolveRequestConfig(req)
  if (!cfg) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: { message: '未配置 AI：请在 Vercel 设置 ROAST_API_KEY，或由用户填入 Key' } }))
    return
  }

  try {
    const raw = await readBody(req)
    const parsed = raw ? JSON.parse(raw) : {}
    const payload = {
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
      res.statusCode = upstream.status
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
      res.end()
      return
    }

    const text = await upstream.text()
    res.statusCode = upstream.status
    res.setHeader('Content-Type', 'application/json')
    res.end(text)
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: { message: err instanceof Error ? err.message : '代理请求失败' },
      })
    )
  }
}
