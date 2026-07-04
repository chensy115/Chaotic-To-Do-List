import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolveServerConfig } from './lib/serverConfig'

/**
 * 公开接口：告知前端是否已有服务端托管 AI（不暴露 Key）
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const server = resolveServerConfig()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, max-age=60')

  if (!server) {
    return res.status(200).json({ available: false })
  }

  return res.status(200).json({
    available: true,
    provider: server.provider,
    model: server.model,
    baseUrl: server.baseUrl,
  })
}
