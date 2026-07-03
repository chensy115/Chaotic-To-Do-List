# V2 产品方案 · 赛博抬杠待办

> **文档状态**：已完成（Phase 5–8 全部落地）  
> **最后更新**：2026-07-03  
> **基线版本**：[product-v1.md](./product-v1.md)（当前已发布的产品能力）  
> **维护说明**：V2 功能落地时，同步更新 §2 缺口状态、§7 分期 checkbox 与 §12 变更日志。

---

## 0. 版本定义

| 概念 | 含义 |
|------|------|
| **V1** | 当前整款产品：抬杠加任务、逃跑打卡、甩锅、画饼指数、本地/AI 抬杠、现 UI 等（见 [product-v1.md](./product-v1.md)） |
| **UI 改版** | V1 发展过程中的界面专项，**不等于 V1**（见 [ui-redesign.md](./ui-redesign.md)） |
| **V2** | 在 V1 基线上的下一版产品迭代，本文档描述其范围与分期 |
| **布局专项 A+E** | V2 后置体验优化，**不是 V3**（见 [layout-a-e.md](./layout-a-e.md)） |

版本号描述的是**产品能力**，专项文档描述**某次改动的设计与落地**，二者分开维护。

---

## 1. 背景与目标

V1 作为当前基线，核心玩法（抬杠加任务、逃跑打卡、腐败度、甩锅、画饼指数）和 AI/本地双模式均已可用；界面已采用「聊天室 + 游戏 HUD」结构（UI 改版专项已落地，见 [ui-redesign.md](./ui-redesign.md)）。

V2 的核心命题是：

> **把 AI 从「加任务守门员」升级为「全程陪怼的 NPC」，并补齐移动端与长期使用的体验短板。**

**V2 目标：**

- 玩法闭环：任务进入战场后 AI 不「失联」，完成 / 甩锅 / 腐败升级均有反馈
- 移动可用：抓捕区在 touch 设备上可玩、可完成
- 体验一致：本地模式与 AI 模式在节奏和上下文深度上对齐
- 可长期用：数据不丢、可管理、可分享
- 可维护：状态拆分、关键逻辑有测试、静态部署有示例

**明确不做（V2 范围外）：**

- 多用户 / 云端同步 / 账号体系
- 真实 Todo 提醒、日历、重复任务
- 重做成原生 App

---

## 2. 现状缺口（相对 V1 基线）

| 维度 | 现状 | V2 目标 |
|------|------|---------|
| **AI 出场** | 仅在「加任务」时抬杠 | 完成、甩锅、腐败升级时也有 Mascot 台词 |
| **腐败台词** | `taskRot.ts` 已有 `taunt` 字段 | 在 `TaskItem` 腐败条旁展示 |
| **完成仪式感** | 完成评语闪 1.6s 后进列表，信息丢失 | 已完成区保留评语、抬杠、甩锅记录 |
| **会话持久** | `pendingTask` / `chatMessages` 仅内存 | 刷新不丢进行中的抬杠 |
| **移动端抓捕** | 全屏 `touchmove` + 小抓捕区，手指易遮挡 | 移动端加大区域、降灵敏度或备选完成方式 |
| **本地引擎** | 未用 `activeTaskCount`、`totalSnoozes` 等上下文 | 与 AI prompt 同等深度的本地台词 |
| **流式体验** | AI 有打字机，本地瞬间出全文 | 本地假流式，统一节奏 |
| **无障碍** | 动效无 `prefers-reduced-motion` | 减弱动画模式 |
| **数据管理** | 已完成只增不减，无导出 | 清空已完成、导出 / 导入 JSON |
| **工程** | `App.tsx` 状态集中、零测试 | Hook 拆分 + 纯函数单测 |
| **部署** | CDN 需自建代理，无示例 | 提供 Serverless 代理模板 |
| **传播** | 无 OG 图、无分享卡片 | 摆烂报告截图 / 文案分享 |

### 2.1 相关文件（V2 主要改动面）

| 文件 | V2 职责 |
|------|---------|
| `src/App.tsx` | 拆状态；会话持久化；全局 toast / 旁白队列 |
| `src/components/TaskItem.tsx` | 腐败 taunt；完成 / 甩锅后旁白触发 |
| `src/components/ChatThread.tsx` | 可选：战场事件回流对话区（「战报模式」） |
| `src/components/EscapingCheckbox.tsx` | 移动端参数；可选「认命模式」 |
| `src/components/HudBar.tsx` | 数据管理入口；分享报告 |
| `src/utils/roastEngine.ts` | 本地上下文增强；完成 / 甩锅 / 腐败台词 |
| `src/utils/aiRoast.ts` | 新场景 API 调用（或复用 `getRoast` 扩展 context） |
| `src/utils/prompts.ts` | 完成 / 甩锅 / 重复任务 system & user 模板 |
| `src/hooks/`（新建） | `useTasks`、`useStats`、`useChatSession` |
| `src/index.css` | `prefers-reduced-motion`；移动端抓捕区；键盘安全区 |

---

## 3. 设计方向

**概念：「全程 NPC + 战报回流」**

- **左侧对话区**：仍是抬杠主舞台；V2 可选将战场事件（完成、甩锅）以「系统战报」气泡插入
- **右侧待办战场**：腐败 taunt 常驻；完成时有 brief 庆祝态再归档
- **底部 HUD**：增加「档案管理」与「今日摆烂报告」入口
- **Mascot**： mood 扩展 `celebrating`（完成）、`disappointed`（甩锅）、`disgusted`（高腐败）

气质不变：**毒舌、搞笑、反内卷**——V2 的反馈也是怼，不是真·生产力工具。

---

## 4. 功能规格

### 4.1 玩法闭环 · NPC 全程陪怼

#### 4.1.1 腐败 taunt 展示

| 项 | 规格 |
|----|------|
| 触发 | `rot.level >= 1` 时在腐败条下方显示 `rot.taunt` |
| 样式 | `.battle-rot-taunt`，`--text-dim`，单行省略，hover 可展开 |
| 更新 | 随 `getTaskRot` 每分钟 tick 切换阶段台词 |

#### 4.1.2 完成反馈

| 项 | 规格 |
|----|------|
| 触发 | 用户抓住「✓ 完成打卡」 |
| 本地 | `generateCompletionRoast(escapeCount)`（已有） |
| AI 可选 | `RoastContext` 扩展 `event: 'complete'`，传入 escapeCount、腐败等级 |
| 展示 | 卡片内 banner 1.6s → 移入「已完成」时写入 `task.completionRoast` |
| Mascot | 战报模式下对话区插入 AI 气泡；或 TaskItem 内 banner 足够（P0 先做 banner + 列表留存） |

#### 4.1.3 甩锅反馈

| 项 | 规格 |
|----|------|
| 触发 | 点击「明日再战」 |
| 本地 | 基于 `generateSnoozeExcuse` 结果再补一句 AI 吐槽（如「又甩锅，画饼指数 +1」） |
| 展示 | 现有 Toast 保留；可选追加短气泡 |

#### 4.1.4 重复任务检测

| 项 | 规格 |
|----|------|
| 规则 | 与已有 active / done 任务文本相似度（归一化后 includes 或 Levenshtein 简版） |
| 台词 | 「你又来了？」「这个词典你加过三次了」 |
| 范围 | 本地引擎 + AI user message 附加提示 |

---

### 4.2 移动端抓捕优化

| 方案 | 规格 | 优先级 |
|------|------|--------|
| A. 加大抓捕区 | `@media (max-width: 639px)`：`arenaHeight` 默认 160，`fleeRadius` 降 15% | P0 |
| B. 触屏优化 | `touchmove` 改绑 `arena` 而非 `window`；按钮 flee 考虑 touch 点偏移 | P0 |
| C. 认命模式 | 连续逃跑 ≥10 次后出现「算了，我认命」按钮，点击完成并嘲讽 | P1 |
| D. 键盘 / 安全区 | HUD `padding-bottom: env(safe-area-inset-bottom)`；输入聚焦时 HUD 收起 | P1 |

---

### 4.3 会话与数据持久化

#### 4.3.1 进行中抬杠会话

```ts
// localStorage key: chaotic-session-v1
interface ChatSession {
  pendingTask: string
  chatMessages: ChatMessage[]
  attemptCount: number
  updatedAt: number
}
```

| 项 | 规格 |
|----|------|
| 写入 | `pendingTask` 非空时 debounce 500ms 写入 |
| 恢复 | App 启动时若 session 存在且 `<24h`，恢复并提示「你还有一场未完的抬杠」 |
| 清除 | dismiss / forceAdd 成功后删除 |

#### 4.3.2 Task  schema 扩展

```ts
interface Task {
  // ...existing
  completionRoast?: string   // 完成时 AI/本地评语
  completedAt?: number
}
```

#### 4.3.3 数据管理（HUD 展开区）

| 操作 | 行为 |
|------|------|
| 清空已完成 | 确认对话框 → 删除 `completed === true` 的任务 |
| 导出 | 下载 `chaotic-backup-YYYYMMDD.json`（tasks + stats + 版本号） |
| 导入 | 选择 JSON → 校验 schema → 合并或覆盖 |
| 重置引导 | 清除 `chaotic-onboarding-v1`，下次访问重现 Onboarding |

#### 4.3.4 Storage 版本

```ts
const STORAGE_VERSION = 2
// key: chaotic-meta → { version, migratedAt }
```

迁移时保留旧 key 只读一次，写入新结构。

---

### 4.4 本地引擎增强

#### 4.4.1 上下文变量（对齐 `prompts.ts`）

| 变量 | 本地用法示例 |
|------|----------------|
| `activeTaskCount >= 5` | 「待办堆成山了，加一个不会少一个」 |
| `totalSnoozes >= 3` | 「甩锅惯犯还加任务？」 |
| `attemptCount === 2` | 已有 `PERSIST_ROASTS` |
| 重复任务 | 新增 `DUPLICATE_ROASTS` |

#### 4.4.2 假流式输出

| 项 | 规格 |
|----|------|
| 函数 | `streamText(text, onChunk, msPerChar = 35)` |
| 使用 | `getRoast` 本地分支在 `onChunk` 存在时逐字回调 |
| 取消 | 新请求 abort 上一段 interval |

---

### 4.5 无障碍与动效

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .confetti-layer { display: none; }
}
```

| 项 | 规格 |
|----|------|
| 聊天播报 | `.chat-messages` 上 `aria-live="polite"` |
| 认命完成 | 隐藏入口 `aria-label="认命完成（无障碍）"` |
| 引导关闭 | Esc 关闭；焦点陷阱在 modal 内 |

---

### 4.6 分享与传播

#### 4.6.1 今日摆烂报告

| 项 | 规格 |
|----|------|
| 入口 | HudBar 展开区 →「生成摆烂报告」 |
| 内容 | 称号、画饼指数、四项统计、今日新增/完成/劝退、最腐败任务 TOP1 |
| 形式 | 纯文本复制 + 可选 `html2canvas` 卡片图（P2，依赖按需引入） |

#### 4.6.2 OG 元数据

`index.html` 增加：

```html
<meta property="og:title" content="赛博抬杠待办" />
<meta property="og:description" content="加任务被 AI 怼，完成按钮会逃跑" />
<meta property="og:image" content="/og.png" />
```

需补充 `public/og.png`（Mascot + 霓虹标题，1200×630）。

---

### 4.7 工程与部署

#### 4.7.1 状态 Hook 拆分

```
src/hooks/
  useTasks.ts      — tasks, persist, complete, delete, snooze
  useStats.ts      — stats, persistStats
  useChatSession.ts — messages, pending, roast, requestRoast, session persist
```

`App.tsx` 保留布局与组合，目标 **<200 行**。

#### 4.7.2 单元测试

| 模块 | 用例示例 |
|------|----------|
| `roastEngine` | 关键词命中、时段、attemptCount、重复任务 |
| `slackerProfile` | 画饼指数边界 0/100、称号优先级 |
| `taskRot` | 6h / 24h / 72h 等级边界 |
| `session` | 序列化 / 24h 过期 |

工具：Vitest（与 Vite 同栈）。

#### 4.7.3 Serverless 代理示例

`docs/deploy/` 或 `examples/vercel-api/roast.ts`：

- 转发逻辑与 `vite-plugin-roast-proxy.ts` 一致
- 环境变量 `ROAST_API_KEY` 可选（或仍由客户端 Header 传入，文档说明安全风险）
- README 补充 Vercel / Cloudflare Workers 部署步骤

---

## 5. Mascot Mood 扩展

| Mood | 条件 | 视觉 |
|------|------|------|
| `celebrating` | 任务完成 banner 显示中 | 撒花 / 竖大拇指（SVG 微调） |
| `disappointed` | 甩锅 Toast 触发后 2s | 白眼 |
| `disgusted` | 腐败度 level ≥ 3 | 捂鼻 |

`AiMascot.tsx` 的 `MascotMood` union 扩展；CSS 类 `ai-mascot--celebrating` 等。

---

## 6. 信息架构（V2 增量）

```
┌─────────────────────────────────────────────────┐
│  Header（不变）                                   │
├──────────────────────┬──────────────────────────┤
│  ChatThread          │  TaskItem                │
│  + 战报气泡（可选）    │  + rot.taunt             │
│                      │  + 完成 banner → 归档      │
├──────────────────────┴──────────────────────────┤
│  HudBar：统计 + 画饼 + [摆烂报告] [数据管理 ▾]      │
└─────────────────────────────────────────────────┘
```

移动端 Tab 增量：

- 「抬杠」Tab 在 `pendingTask` 非空时显示红点
- 输入聚焦时 HUD 收起到 mini 条（仅画饼 + 展开按钮）

---

## 7. 实施分期

### Phase 5 — 玩法闭环（P0）

- [x] `TaskItem` 展示 `rot.taunt`
- [x] 完成评语写入 `task.completionRoast`，已完成列表展示
- [x] 本地引擎：重复任务 + 高堆叠 / 高甩锅台词
- [x] 移动端抓捕区参数调优（方案 A + B）

**预估**：0.5–1 天  
**验收**：腐败任务能看到 taunt；完成后再进「已完成」仍能看到评语；手机可稳定完成一次打卡。

---

### Phase 6 — 体验一致（P1）

- [x] 本地假流式输出
- [x] 抬杠会话 `localStorage` 持久化与恢复
- [x] 「认命模式」备选完成
- [x] `prefers-reduced-motion`
- [x] Tab 抬杠红点；输入时 HUD 收起
- [x] `aria-live` + 引导 Esc 关闭

**预估**：1–1.5 天  
**验收**：刷新不丢进行中抬杠；减弱动画系统生效；VoiceOver / NVDA 能读到新 AI 消息。

---

### Phase 7 — 长期可用（P2）

- [x] HUD 数据管理：清空已完成、导出、导入
- [x] Storage 版本与迁移
- [x] 摆烂报告（文本复制）
- [x] AI 完成 / 甩锅场景（扩展 `RoastContext.event`）
- [x] Mascot mood：`celebrating` / `disappointed` / `disgusted`

**预估**：1.5–2 天  
**验收**：换机导入导出 round-trip 无丢失；报告文案可一键复制。

---

### Phase 8 — 工程与发布（P3）

- [x] `useTasks` / `useStats` / `useChatSession` 拆分
- [x] Vitest 覆盖核心 utils
- [x] `public/og.svg` + OG meta
- [x] Serverless 代理示例 + README 部署章节
- [ ] （可选）摆烂报告 html2canvas 图片

**预估**：1–2 天  
**验收**：`npm test` 绿；`npm run build` 产物可部署到 Vercel 且 AI 配置可用。

---

## 8. 优先级总览

| 优先级 | Phase | 主题 | 用户感知 |
|--------|-------|------|----------|
| P0 | 5 | 玩法闭环 + 移动抓捕 | 「更好玩、手机能玩」 |
| P1 | 6 | 体验一致 + 无障碍 | 「更顺滑、不丢进度」 |
| P2 | 7 | 数据 + 分享 + AI 深化 | 「能长期用、愿分享」 |
| P3 | 8 | 工程 + 部署 | 「能维护、能上线」 |

---

## 9. 风险与对策

| 风险 | 对策 |
|------|------|
| 认命模式降低挑战感 | 高逃跑次数才出现；文案嘲讽「你抓不到才来求饶」 |
| 会话恢复造成困惑 | 超过 24h 自动丢弃；恢复时顶部 banner 说明 |
| 导入恶意 JSON | 校验字段类型与长度上限；失败 toast |
| html2canvas 体积 | 放 Phase 8 可选依赖 |
| AI 多场景调用成本 | 完成 / 甩锅默认本地；设置内可选「全程 AI」 |

---

## 10. 成功指标（定性）

- 新用户 3 分钟内完成「加任务 → 被怼 → 强行加入 → 完成打卡」全链路（含移动端）
- 本地模式下抬杠内容与 AI 模式一样「记得住」用户堆叠待办 / 甩锅历史
- 刷新页面后进行中抬杠可恢复
- Lighthouse Accessibility ≥ 85（动效减弱模式下）

---

## 11. 变更日志

| 日期 | 变更 |
|------|------|
| 2026-07-03 | 初版 V2 方案：玩法闭环、移动优化、持久化、工程与部署 |
| 2026-07-03 | 修正版本定义：V1 = 产品基线，UI 改版降为专项文档 |
| 2026-07-03 | Phase 5–8 全部落地（html2canvas 报告仍为可选） |
| 2026-07-03 | 新增后置布局专项 [layout-a-e.md](./layout-a-e.md)（A+E，非 V3） |

---

## 12. 文档维护约定

1. **§2 缺口表** — 某项完成后改 ✅ 并链到 PR / commit
2. **§7 分期** — 勾选 checkbox，注明完成日期
3. **§11 变更日志** — 追加条目
4. 与 [product-v1.md](./product-v1.md) 关系：V1 基线随产品发布更新；V2 只记录相对 V1 的增量
5. 与 [ui-redesign.md](./ui-redesign.md) 关系：UI 改版为已完成专项，V2 若涉及界面改动另开章节，不与之混为版本号
6. 与 [layout-a-e.md](./layout-a-e.md) 关系：V2 能力完成后的布局专项，口头可称 V2.1
7. 下一版见 [v3-roadmap.md](./v3-roadmap.md)

**文档状态枚举：**

- `规划中` — 方案已定，代码未改（当前）
- `进行中` — 部分 Phase 已实施
- `已完成` — Phase 5–8 全部落地（或明确裁剪范围）
