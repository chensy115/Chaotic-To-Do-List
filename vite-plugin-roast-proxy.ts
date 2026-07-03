import { Readable } from 'node:stream'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString()
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function handleRoastProxy(req: IncomingMessage, res: ServerResponse) {
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

  const apiKey = req.headers['x-api-key'] as string | undefined
  const baseUrl = ((req.headers['x-api-base-url'] as string) || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = (req.headers['x-api-model'] as string) || 'gpt-4o-mini'

  if (!apiKey?.trim()) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: { message: '缺少 API Key' } }))
    return
  }

  try {
    const body = await readBody(req)
    const parsed = body ? JSON.parse(body) : {}
    const payload: Record<string, unknown> = {
      model,
      messages: parsed.messages,
      max_tokens: parsed.max_tokens ?? 80,
      temperature: parsed.temperature ?? 0.85,
      stream: parsed.stream ?? false,
    }

    // 转发 Qwen 等非标准参数（如 enable_thinking）
    if (parsed.enable_thinking !== undefined) {
      payload.enable_thinking = parsed.enable_thinking
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
    })

    if (payload.stream && upstream.ok && upstream.body) {
      res.statusCode = upstream.status
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      Readable.fromWeb(upstream.body as import('node:stream/web').ReadableStream).pipe(res)
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

/** 开发/预览时通过本地代理转发，避免浏览器 CORS 限制 */
export function roastProxy(): Plugin {
  const attach = (server: { middlewares: { use: (path: string, handler: typeof handleRoastProxy) => void } }) => {
    server.middlewares.use('/api/roast', handleRoastProxy)
  }

  return {
    name: 'roast-proxy',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}
