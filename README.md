# 赛博抬杠待办 · Chaotic To-Do List

普通的 Todo List 都在催你上进，这个劝你躺平。

## 玩法

1. **添加任务** — 输入「晚上 8 点背单词」，AI 会立刻抬杠：「大晚上的背什么单词？不如去睡觉。」
2. **倔强添加** — 点「我偏要加！」会再被怼一次，第二次才能强行加入清单
3. **完成打卡** — 「✓ 完成打卡」按钮会在屏幕上随机逃跑，你得抓住它才算完成

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 接入真实 AI

### 方式一：部署托管（推荐给访客使用）

部署到 Vercel 并在环境变量配置 `ROAST_API_KEY`，**访客无需自配 Key** 即可使用 AI。详见 [docs/deploy/vercel.md](docs/deploy/vercel.md)。

### 方式二：界面自配 Key（本地 / BYOK）

1. 启动应用后，点击右上角 **「⚙️ AI 配置」**
2. 选择服务商，填入 API Key，点击 **「测试连接」**
3. 勾选「启用真实 AI 抬杠」，保存

### 方式三：本地 `.env` 服务端 Key

```env
ROAST_API_KEY=sk-xxx
ROAST_API_BASE_URL=https://api.deepseek.com/v1
ROAST_API_MODEL=deepseek-chat
```

重启 `npm run dev` 后，本地也会模拟「托管模式」。

### 支持的服务商

| 服务商 | Base URL | 模型示例 |
|--------|----------|----------|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |

任何 OpenAI 兼容接口均可，选「自定义」填入 Base URL 和模型名即可。

> **注意**：`npm run dev` 和 `npm run preview` 自带 API 代理。公开部署请用 Vercel（见 [docs/deploy/vercel.md](docs/deploy/vercel.md)）。

## 数据与 V2/V3 功能

- 待办与统计保存在浏览器 localStorage
- 底部 HUD 展开后可：**摆烂报告**（复制 / **保存图片**）、**导出/导入** JSON（含徽章）、**清空已完成**
- 抬杠会话 24 小时内刷新可恢复
- 完成 / 甩锅后 AI 战报会出现在对话区；对话区可筛选「全部 / 抬杠 / 战报 / 我的」
- AI 配置可开启 **全程 AI**（完成 / 甩锅也走 API）
- **奇迹纪念馆**：徽章墙、最惨一仗、已完成评语
- **摆烂日志**：对话区「对话 | 日志」Tab，记录加任务 / 抬杠 / 战报 / 完成 / 甩锅全链路
- **NPC 人格**：AI 配置可选毒舌导师 / 摸鱼同事 / 阴阳室友
- **7 日画饼曲线**：HUD 档案区 mini 折线图
- **本周周报 / 今日挑战**：HUD 一键复制周报；顶部每日反直觉挑战 banner
- **腐败 Boss**：rot 4 级任务边框 pulse、Boss taunt 轮换、认命门槛降至 8 次

## 安装为 App（PWA）

`npm run build` 后部署到 HTTPS（或本地 `npm run preview`），Chrome / Edge 地址栏会出现 **安装应用**。

- 离线可打开已缓存的静态界面；**AI 抬杠仍需网络**（`/api/roast` 不缓存）
- 首次可安装时可能 toast 提示「添加到主屏幕」
- 图标：`public/pwa-192.png` / `pwa-512.png`

## 分享备份

HUD 档案 → **导出文件**，可将摆烂档案发给他人或存网盘；对方用 **导入** 恢复。详见 [docs/share-snapshot.md](docs/share-snapshot.md)。

## 测试

```bash
npm test
```

## 技术栈

- React + TypeScript + Vite
- 本地关键词/时间感知抬杠引擎
- 鼠标追踪逃跑按钮（移动端支持 touch）

## 统计

- 🛡️ 劝退 — 点了「好吧算了」的次数
- 🏃 逃跑 — 完成按钮累计逃跑次数
- 💀 完成 — 顽强完成的奇迹数量
