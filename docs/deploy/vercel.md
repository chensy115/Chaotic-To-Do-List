# Vercel 部署指南

让其他人**不用配置 API Key** 也能用真实 AI：Key 只存在 Vercel 服务端。

## 步骤

1. 把仓库推到 GitHub（已完成）
2. 打开 [vercel.com](https://vercel.com) → **Add New → Project** → 选择 `Chaotic-To-Do-List`
3. Build 设置保持默认：
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 展开 **Environment Variables**，添加：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `ROAST_API_KEY` | `sk-xxx` | **必填**，你的 DeepSeek / OpenAI Key |
| `ROAST_API_BASE_URL` | `https://api.deepseek.com/v1` | 可选，默认 DeepSeek |
| `ROAST_API_MODEL` | `deepseek-chat` | 可选 |
| `ROAST_PROVIDER` | `deepseek` | 可选，仅用于界面显示 |

5. 点 **Deploy**

## 部署后行为

- 访客打开网站 → 自动检测到服务端 AI → **直接可用**，无需填 Key
- 右上角显示 `AI · deepseek`（或你设的 provider）
- AI 配置里可改 **NPC 人格**、**全程 AI** 等偏好
- 高级用户仍可展开「使用自己的 API Key」

## 本地开发（模拟托管模式）

复制 `.env.example` 为 `.env`，填入 `ROAST_API_KEY`（**不要**加 `VITE_` 前缀）：

```env
ROAST_API_KEY=sk-xxx
ROAST_API_BASE_URL=https://api.deepseek.com/v1
ROAST_API_MODEL=deepseek-chat
```

然后 `npm run dev`，效果与线上一致。

## 架构

```
访客浏览器 ──POST /api/roast──► Vercel Serverless (api/roast.ts)
                                      │
                                      ▼ ROAST_API_KEY（环境变量）
                                 DeepSeek / OpenAI …
```

`GET /api/ai-status` 只返回 `{ available: true, provider, model }`，**不暴露 Key**。

## 费用与安全

- Key 在服务端，访客看不到，但**所有访客共用你的 Key 额度**
- 建议在 AI 平台设置用量上限 / 余额告警
- 公开给大量用户时，可考虑后续加速率限制

## Cloudflare Workers

逻辑与 `vite-plugin-roast-proxy.ts` 相同，读取 `ROAST_API_KEY` 环境变量转发即可。
