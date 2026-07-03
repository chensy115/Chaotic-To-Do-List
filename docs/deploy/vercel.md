# Vercel 部署示例

将静态前端与 API 代理一起部署到 Vercel，解决纯 CDN 无法调用 AI 的问题。

## 步骤

1. 复制 `examples/vercel-api/api/roast.ts` 到项目根目录的 `api/roast.ts`
2. 安装可选类型（本地开发时）：`npm i -D @vercel/node`
3. 构建前端：`npm run build`
4. 在 Vercel 创建项目，Build Command 为 `npm run build`，Output Directory 为 `dist`
5. 部署后，前端请求 `/api/roast` 会由 Serverless 函数转发

## 安全说明

- API Key 仍由浏览器经 Header 传入（与本地 dev 一致），适合个人玩具项目
- 若需更高安全性，可改为服务端环境变量 `ROAST_API_KEY`，并移除客户端传 Key 逻辑

## Cloudflare Workers

逻辑与 `vite-plugin-roast-proxy.ts` 相同，将 `fetch` 转发到 OpenAI 兼容接口即可。Workers 需自行处理 SSE 流式响应。
