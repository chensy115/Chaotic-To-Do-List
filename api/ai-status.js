import { resolveServerConfig } from './_shared.js'

/** 公开接口：告知前端是否已有服务端托管 AI（不暴露 Key） */
export default function handler(_req, res) {
  const server = resolveServerConfig()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json')

  if (!server) {
    res.statusCode = 200
    res.end(JSON.stringify({ available: false }))
    return
  }

  res.statusCode = 200
  res.end(
    JSON.stringify({
      available: true,
      provider: server.provider,
      model: server.model,
      baseUrl: server.baseUrl,
    })
  )
}
