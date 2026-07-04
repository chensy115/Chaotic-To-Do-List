const { resolveServerConfig } = require('./_shared.cjs')

/** 公开接口：告知前端是否已有服务端托管 AI（不暴露 Key） */
module.exports = function handler(_req, res) {
  const server = resolveServerConfig()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, max-age=60')
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
