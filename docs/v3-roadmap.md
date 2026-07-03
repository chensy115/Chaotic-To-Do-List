# V3 产品方案 · 赛博抬杠待办

> **文档状态**：已完成（Phase 9–13 全部落地）  
> **最后更新**：2026-07-03  
> **基线版本**：[v2-roadmap.md](./v2-roadmap.md) + [layout-a-e.md](./layout-a-e.md)（V2 / V2.1 已全部落地）  
> **维护说明**：V3 功能落地时，同步更新 §2 缺口状态、§8 分期 checkbox 与 §12 变更日志。

---

## 0. 版本定义

| 概念 | 含义 |
|------|------|
| **V1** | 产品基线：抬杠加任务、逃跑打卡、画饼指数等（见 [product-v1.md](./product-v1.md)） |
| **V2** | 全程 NPC、移动抓捕、会话持久、数据管理、工程化（见 [v2-roadmap.md](./v2-roadmap.md)） |
| **V2.1** | 布局专项 A+E：双栏内滚 + 奇迹纪念馆（见 [layout-a-e.md](./layout-a-e.md)） |
| **V3** | 在 V2 基线上的下一版：**摆烂档案** — 成就、时间线、周期回顾、传播与个性化 NPC |

版本号描述**产品能力**；专项文档描述某次界面/结构改动，二者分开维护。

---

## 1. 背景与目标

V2 解决了「能玩、能留、手机能抓按钮」。V2.1 解决了「信息架构不挤、纪念馆有归宿」。

V3 的核心命题是：

> **把 localStorage 里的数据变成「可炫耀、可回看、愿意分享」的个人梗史，并让 NPC 更有性格、更有回访理由。**

**V3 目标：**

- **档案感**：成就徽章、统一时间线、周期回顾，数据有叙事而不只是列表
- **传播力**：摆烂报告图片、周报卡片、OG 静态图，一键分享
- **个性化**：NPC 人格档位、可选「全程 AI」，同一任务不同怼法
- **回访动机**：每日反直觉挑战、腐败 Boss 终局、纪念馆里程碑
- **可达性**：PWA 可安装，仍不做原生 App

**明确不做（V3 范围外，与 V2 一致）：**

- 多用户 / 完整账号体系 / 实时云端同步
- 真实 Todo 提醒、日历、定时重复任务（cron）
- 重做成原生 App（PWA 可接受）
- 变成正经生产力工具（提醒、协作、看板）

**V3 可选边界（Phase 10，按需裁剪）：**

- 轻量匿名快照链接（无登录，export JSON → 静态页预览）
- 仅英文 i18n 壳（台词库工作量极大，默认中文）

---

## 2. 现状缺口（相对 V2 基线）

| 维度 | 现状 | V3 目标 |
|------|------|---------|
| **分享形态** | 摆烂报告仅文本复制 | 可选 html2canvas 卡片图 + 周报模板 |
| **AI 深度** | 完成 / 甩锅默认本地台词 | 设置内「全程 AI」；人格档位影响 prompt |
| **战报浏览** | 对话区线性堆叠 | 按类型筛选（抬杠 / 完成 / 甩锅 / 战报） |
| **纪念馆** | 列表 + 评语 | 徽章墙、最惨一仗、完成庆祝联动 |
| **叙事结构** | Task、ChatMessage、战报分散 | 统一「摆烂日志」时间线（可选 Tab） |
| **长期趋势** | 画饼指数为瞬时值 | 近 7 日曲线 + 周报文案 |
| **回访玩法** | 无日更机制 | 每日反直觉挑战（本地） |
| **腐败终局** | rot 4 级仅 taunt + 抓捕变难 | Boss 态：特殊 taunt 链 / 认命门槛变化 |
| **安装体验** | 纯 Web | PWA manifest + Service Worker（离线壳） |
| **外链预览** | `og.svg` | `og.png` 1200×630 |
| **V2 收尾** | html2canvas、全程 AI 未做 | Phase 9 一并落地 |

### 2.1 相关文件（V3 主要改动面）

| 文件 | V3 职责 |
|------|---------|
| `src/types.ts` | `TimelineEntry`、`Badge`、`PersonalityId`、`DailyChallenge` 等 |
| `src/utils/slackerProfile.ts` | 徽章判定、周报聚合 |
| `src/utils/slackerReport.ts` | 周报文案；图片报告数据层 |
| `src/utils/roastEngine.ts` | 人格模板池；Boss taunt |
| `src/utils/prompts.ts` | 人格 system 模板；全程 AI 场景 |
| `src/utils/aiRoast.ts` | 读取 `fullAiMode` / `personality` |
| `src/utils/apiConfig.ts` | `fullAiMode`、`personality` 持久化 |
| `src/utils/timeline.ts`（新建） | Task + Chat + 战报 → 统一时间线 |
| `src/utils/badges.ts`（新建） | 解锁条件与持久化 |
| `src/utils/dailyChallenge.ts`（新建） | 每日挑战生成与校验 |
| `src/utils/weeklyStats.ts`（新建） | 7 日画饼曲线点 |
| `src/components/MiracleMemorial.tsx` | 徽章墙、最惨一仗 |
| `src/components/ChatThread.tsx` | 战报筛选 Tab |
| `src/components/HudBar.tsx` | 周报入口、挑战入口 |
| `src/components/ApiSettings.tsx` | 全程 AI、人格选择 |
| `src/components/TimelinePanel.tsx`（新建） | 摆烂日志 Tab / 面板 |
| `src/components/ShareCard.tsx`（新建） | 报告 / 周报 DOM → 图片 |
| `src/components/DailyChallengeBanner.tsx`（新建） | 今日挑战 |
| `src/hooks/useTimeline.ts`（新建） | 时间线聚合与写入 |
| `src/hooks/useBadges.ts`（新建） | 徽章解锁 toast |
| `public/manifest.webmanifest`（新建） | PWA |
| `public/og.png`（新建） | OG 静态图 |

---

## 3. 设计方向

**概念：「摆烂档案 · 你的梗都有据可查」**

- **左栏**：仍是抬杠主舞台；增加战报筛选；可选「日志」视图切换为统一时间线
- **右栏**：战场不变；腐败 Boss 态视觉加重（边框 / taunt 链）
- **纪念馆**：从「完成列表」升级为「成就馆」— 徽章 + 奇迹 + 最惨一仗
- **HUD**：画饼曲线 mini  sparkline；「今日挑战」；「周报 / 分享卡片」
- **设置**：人格档位 + 全程 AI

气质不变：**毒舌、搞笑、反内卷** — V3 的成就是嘲讽式勋章，不是 Duolingo  streak。

---

## 4. 功能规格

### 4.1 V2 收尾 · 传播与 AI 深化（Phase 9）

#### 4.1.1 摆烂报告图片

| 项 | 规格 |
|----|------|
| 依赖 | `html2canvas` 按需 dynamic import |
| 入口 | HudBar「生成摆烂报告」旁增加「保存图片」 |
| 内容 | 与 `generateSlackerReport` 同源：称号、画饼、四项统计、最腐败任务 |
| 样式 | 固定宽 600px 卡片 DOM，`ShareCard` 组件；霓虹 HUD 风 |
| 失败 | 降级为纯文本复制 + toast |

#### 4.1.2 全程 AI

| 项 | 规格 |
|----|------|
| 配置 | `ApiConfig.fullAiMode: boolean`，默认 `false` |
| 行为 | `true` 时 `complete` / `snooze` 事件走 `getEventRoast` AI 分支；失败 fallback 本地 |
| UI | ApiSettings 勾选「完成 / 甩锅也用 AI（更耗 Key）」 |
| 成本提示 | 小字说明多场景调用 |

#### 4.1.3 战报筛选

| 项 | 规格 |
|----|------|
| UI | ChatThread 顶部 pill：`全部` `抬杠` `战报` `我的` |
| 规则 | `role: user` → 我的；`assistant` → 抬杠；`report` → 战报 |
| 持久 | 筛选状态仅 session，不写入 localStorage |

#### 4.1.4 OG 静态图

| 项 | 规格 |
|----|------|
| 文件 | `public/og.png` 1200×630 |
| meta | `index.html` 中 `og:image` 指向 `/og.png`（保留 svg 作 favicon 备选） |

---

### 4.2 成就与纪念馆（Phase 10）

#### 4.2.1 徽章体系

```ts
interface Badge {
  id: string
  emoji: string
  title: string
  description: string
  unlockedAt?: number
}

// localStorage key: chaotic-badges-v1 → Badge[]
```

| 徽章 id | 条件 | 文案方向 |
|---------|------|----------|
| `reject-10` | `stats.rejected >= 10` | 劝退免疫体 |
| `escape-50` | `stats.escaped >= 50` | 按钮追逐赛冠军 |
| `snooze-8` | `stats.snoozed >= 8` | 明日复明日专家 |
| `complete-5` | `stats.completed >= 5` | 反常人类 |
| `pie-90` | 画饼指数 ≥ 90 | 画饼宗师 |
| `rot-boss` | 任一任务 rot.level === 4 且仍 active | 腐败领主 |
| `surrender` | 使用过认命完成 | 认命真香 |

| 项 | 规格 |
|----|------|
| 解锁 | 统计变化时 `checkBadges(stats, tasks)`；新徽章 toast + Mascot `celebrating` |
| 展示 | 纪念馆顶部徽章墙；未解锁灰显 + hover 见条件 |
| 持久 | 写入 `chaotic-badges-v1`，随 export/import 一并迁移 |

#### 4.2.2 纪念馆增强

| 项 | 规格 |
|----|------|
| 最惨一仗 | 已完成中 `escapeCount` 最大者，置顶 highlight |
| 当初抬杠 | 已有，保留 |
| 完成庆祝 | 归档瞬间 Confetti + 若解锁徽章则 brief banner |

---

### 4.3 统一时间线（Phase 11）

```ts
type TimelineKind = 'user' | 'roast' | 'report' | 'task_added' | 'task_done' | 'task_snooze'

interface TimelineEntry {
  id: string
  at: number
  kind: TimelineKind
  text: string
  taskId?: string
  meta?: Record<string, unknown>
}
```

| 项 | 规格 |
|----|------|
| 数据源 | 由 `tasks` + `chatMessages`（会话内）+ 持久化 `chaotic-timeline-v1` 聚合 |
| 写入 | 加任务 / 抬杠 / 战报 / 完成 / 甩锅时 append entry |
| 展示 | 桌面：ChatThread 内 Tab「日志」；移动：可选第三 Tab 或纪念馆子 Tab |
| 排序 | `at` 降序；同秒按 kind 优先级 |
| 上限 | 保留最近 500 条，超出 trim 最旧（export 含全量） |
| 与 layout-a-e | 实现 [layout-a-e.md §7](./layout-a-e.md) 预留的「V3 时间线合一」 |

---

### 4.4 NPC 人格（Phase 11）

| 档位 id | 名称 | 语气 |
|---------|------|------|
| `colleague` | 摸鱼同事 | 懒散共情，「一起摆呗」 |
| `mentor` | 毒舌导师 | 默认，现有 prompt 基调 |
| `roommate` | 阴阳室友 | 短句、反问、网络梗 |

| 项 | 规格 |
|----|------|
| 存储 | `ApiConfig.personality: PersonalityId`，默认 `mentor` |
| 本地 | `roastEngine` 按人格选模板池前缀 |
| AI | `prompts.ts` 注入不同 system 段落 |
| UI | ApiSettings 三选一 radio |

---

### 4.5 周期回顾（Phase 12）

#### 4.5.1 画饼曲线

| 项 | 规格 |
|----|------|
| 范围 | 近 7 日，按自然日聚合 |
| 算法 | 每日结束时的 `calcPieIndex` 快照；首次打开 V3 起写入 `chaotic-daily-snapshots-v1` |
| 展示 | HudBar 展开区 mini SVG sparkline；hover 显示日期与数值 |

#### 4.5.2 摆烂周报

| 项 | 规格 |
|----|------|
| 入口 | HudBar「生成本周摆烂周报」 |
| 内容 | 本周新增 / 完成 / 劝退 / 甩锅、画饼均值、最腐败任务、新解锁徽章 |
| 形式 | 文本复制 + 共用 `ShareCard` 出图 |
| 触发 | 手动；不做 push 提醒 |

---

### 4.6 回访玩法（Phase 12）

#### 4.6.1 每日反直觉挑战

```ts
interface DailyChallenge {
  date: string       // YYYY-MM-DD
  id: string
  title: string
  done: boolean
}
```

| 挑战池示例 | 完成条件 |
|------------|----------|
| 今日禁止甩锅 | 当日 0 次 snooze |
| 今日只加 1 条 | `todayAdded <= 1` 且至少加过 1 条 |
| 今日必须完成 1 条 | `todayDone >= 1` |
| 今日劝退一次 | `stats.rejected` 当日 +1 |

| 项 | 规格 |
|----|------|
| 生成 | 按日期 seed 稳定随机，localStorage `chaotic-daily-challenge-v1` |
| UI | HUD 上方 slim banner；完成打勾 + 一句嘲讽奖励 |
| 失败 | 无惩罚，仅无奖励文案 |

#### 4.6.2 腐败 Boss 终局

| 项 | 规格 |
|----|------|
| 触发 | `rot.level === 4` |
| 表现 | TaskItem 边框 pulse；taunt 每 30s 轮换 Boss 池；`fleeRadius` 已达上限 |
| 认命 | Boss 态认命门槛降为 escape ≥ 8（非 Boss 仍 ≥ 10） |
| 徽章 | 触发 `rot-boss` 徽章（任务仍 active 时检测） |

---

### 4.7 PWA 与可选传播（Phase 13）

#### 4.7.1 PWA

| 项 | 规格 |
|----|------|
| manifest | `name`、`short_name`、`theme_color`、`icons` 192/512 |
| SW | 缓存静态壳；**不**缓存 API；离线可打开，AI 需网络 |
| 提示 | 首次访问 optional「添加到主屏幕」toast（仅支持 browser） |

#### 4.7.2 匿名快照（可选）

| 项 | 规格 |
|----|------|
| 形式 | 导出 JSON → 用户自行托管 / 未来 gist API |
| V3 最小 | 文档说明 + 「复制分享 JSON」；不做后端 |

---

## 5. 信息架构（V3 增量）

```
桌面
┌─────────────────────────────────────────────────┐
│  ChatThread                                      │
│  [ 对话 | 日志 ]     筛选: 全部·抬杠·战报·我的    │
├──────────────────────┬──────────────────────────┤
│  （对话或时间线）      │  待办战场 + Boss 视觉      │
├──────────────────────┴──────────────────────────┤
│  今日挑战 banner（可 dismiss 当日）                 │
│  HudBar：画饼 sparkline · 周报 · 报告 · 档案      │
└─────────────────────────────────────────────────┘

移动 Tab：抬杠 | 待办（+ 日志入口在抬杠 Tab 内切换）
纪念馆 modal：徽章墙 → 列表 → 最惨一仗
```

---

## 6. Storage 版本

```ts
const STORAGE_VERSION = 3
// chaotic-meta → { version: 3, migratedAt }
// 新增 keys:
//   chaotic-badges-v1
//   chaotic-timeline-v1
//   chaotic-daily-snapshots-v1
//   chaotic-daily-challenge-v1
```

导入 export 时合并 badges / timeline；`STORAGE_VERSION` 2 → 3 迁移脚本在 `storage.ts`。

---

## 7. 风险与对策

| 风险 | 对策 |
|------|------|
| html2canvas 体积 | dynamic import；仅点击分享时加载 |
| 全程 AI 成本高 | 默认关；设置内明示 |
| 时间线数据膨胀 | 500 条 trim；export 全量 |
| 每日挑战像正经 Todo | 挑战文案嘲讽向；无 streak 惩罚 |
| PWA 与 Vite 配置 | 用 `vite-plugin-pwa` 或手写最小 SW |
| 功能过多延期 | 严格按 Phase 9→13 交付，可裁剪 Phase 13 快照 |

---

## 8. 实施分期

### Phase 9 — V2 收尾（P0）

- [x] html2canvas 摆烂报告图片
- [x] ApiSettings「全程 AI」
- [x] ChatThread 战报筛选
- [x] `public/og.png` + meta

**预估**：1–1.5 天  
**验收**：报告可存图；全程 AI 完成时有 AI 评语；筛选正确；社交预览有图。

---

### Phase 10 — 成就馆（P0）

- [x] `badges.ts` + 解锁检测 + toast
- [x] 纪念馆徽章墙 + 最惨一仗
- [x] export/import 含 badges
- [x] 完成 / 解锁庆祝联动

**预估**：1.5–2 天  
**验收**：达成条件出现徽章；纪念馆可见已解锁与灰显；换机 import 徽章仍在。

---

### Phase 11 — 日志与人格（P1）

- [x] `timeline.ts` + 事件写入 + `TimelinePanel`
- [x] ChatThread「对话 | 日志」切换
- [x] 人格三档 + 本地 / AI 模板
- [x] Storage 导出/导入含 timeline

**预估**：2–2.5 天  
**验收**：完成一条任务可在日志看到完整链路；换人格后新抬杠语气明显不同。

---

### Phase 12 — 回顾与挑战（P1）

- [x] 7 日画饼快照 + HudBar sparkline
- [x] 摆烂周报文本 + 分享图
- [x] 每日挑战 banner + 完成判定
- [x] 腐败 Boss 视觉 + taunt 池 + 认命门槛

**预估**：2–3 天  
**验收**：连续用 7 天可见曲线；周报一键复制；当日挑战可完成；rot4 任务有 Boss 态。

---

### Phase 13 — PWA 与 Polish（P2）

- [x] PWA manifest + Service Worker
- [x] 单元测试：badges / timeline / dailyChallenge / weeklyStats
- [x] README V3 章节
- [x] 匿名快照文档 + HUD「复制 JSON」

**预估**：1–2 天  
**验收**：Chrome「安装应用」可用；`npm test` 绿；文档与 V3 能力一致。

---

## 9. 优先级总览

| 优先级 | Phase | 主题 | 用户感知 |
|--------|-------|------|----------|
| P0 | 9 | V2 收尾 + 分享图 | 「能发图、AI 更全程」 |
| P0 | 10 | 成就馆 | 「有收集、纪念馆更好玩」 |
| P1 | 11 | 时间线 + 人格 | 「一条线看懂摆烂史、NPC 有性格」 |
| P1 | 12 | 周报 + 挑战 + Boss | 「愿意明天再来」 |
| P2 | 13 | PWA + 测试 | 「像 App、好维护」 |

**建议上线节奏**：Phase 9+10 可先称 **V3.0**；11+12 为 **V3.1**；13 为 **V3.2**（口头补丁名，不必改主版本号）。

---

## 10. 成功指标（定性）

- 用户能生成并保存一张摆烂报告/周报图片到相册
- 纪念馆至少解锁 3 枚徽章后仍有继续动力（新任务触发新条件）
- 时间线中可看到「加任务 → 抬杠 → 完成/甩锅」完整故事
- 连续 3 天打开应用，每日挑战文案不重复感过强
- Lighthouse PWA 可安装；Accessibility 仍 ≥ 85

---

## 11. 变更日志

| 日期 | 变更 |
|------|------|
| 2026-07-03 | Phase 13 落地：PWA、复制 JSON 分享、测试与 README |
| 2026-07-03 | Phase 11–12 落地：摆烂日志、NPC 人格、画饼曲线、周报、每日挑战、Boss 战 |
| 2026-07-03 | Phase 9–10 落地：分享图、全程 AI、战报筛选、OG 图、徽章馆 |

---

## 12. 文档维护约定

1. **§2 缺口表** — 某项完成后改 ✅ 并链到 PR / commit
2. **§8 分期** — 勾选 checkbox，注明完成日期
3. **§11 变更日志** — 追加条目
4. 与 [v2-roadmap.md](./v2-roadmap.md) 关系：V2 只记录至 Phase 8 + 布局专项；V3 为相对 V2 的增量
5. 与 [layout-a-e.md](./layout-a-e.md) 关系：时间线合一在本方案 Phase 11 落地，实现其 §7 预留项
6. 新界面专项（若单独立项大改 HUD）可另开 `docs/xxx.md`，不改变 V3 版本号定义

**文档状态枚举：**

- `规划中` — 方案已定，代码未改
- `已完成` — Phase 9–13 全部落地（**当前**）
