# UI 改版方案 · 赛博抬杠待办

> **文档状态**：已完成（Phase 1–4 全部落地）  
> **最后更新**：2026-07-03  
> **文档定位**：这是一次 **UI / 布局专项**，不是产品版本号。当前产品 V1 全貌见 [product-v1.md](./product-v1.md)；下一版规划见 [v2-roadmap.md](./v2-roadmap.md)。  
> **维护说明**：界面有变更时，同步更新本文档中「当前实现」与「规划目标」的对应章节。

---

## 1. 背景与目标

「赛博抬杠待办」的产品性格是 **抬杠、混乱、反内卷**。改版后界面采用「聊天室 + 游戏 HUD」结构，气质与玩法对齐。

**改版目标：**

- ✅ 让用户第一眼感受到「这 AI 要跟我吵架」，而不是「又一个 Todo App」
- ✅ 把核心玩法（抬杠对话、逃跑打卡、腐败度、甩锅）做成视觉焦点
- ✅ 降低首屏信息噪音，统计下沉至底部 HUD
- ✅ 建立可识别的品牌 IP（Mascot + 赛博霓虹视觉）

---

## 2. 现状诊断（改版后）

| 维度 | 原问题 | 现状 |
|------|--------|------|
| **视觉气质** | SaaS 紫粉玻璃风 | ✅ 霓虹青/粉/黄 + 实色卡片（`src/index.css` token） |
| **信息层级** | 三块权重接近 | ✅ 左对话主舞台 / 右待办副舞台 / 底 HUD |
| **空间利用** | 顶部档案卡占屏 | ✅ `HudBar` 固定底部，可展开详情 |
| **角色 IP** | Mascot 仅抬杠时出现 | ✅ `ChatThread` 常驻 72px Mascot |
| **核心玩法** | 逃跑区不突出 | ✅ `BattleCard` 顶部腐败条 +「抓捕区」虚线框 |
| **代码债** | 废弃 CSS 类 | ✅ 移除 `.topbar`、`.zone`、`SlackerProfile`、`RoastPanel` |

### 2.1 当前布局（As-Is · 已实现）

```
[ Header：标题 + 状态 + AI 配置 ]
[ Mobile：抬杠 | 待办 Tab ]          ← <840px
[ AI 对话区 ChatThread ] | [ 待办战场 BattleCard ]
[ HudBar：统计 + 画饼指数 ]          ← 固定底部
```

**主要文件：**

| 文件 | 职责 |
|------|------|
| `src/App.tsx` | 双栏布局、聊天状态、移动端 Tab |
| `src/components/HudBar.tsx` | 底部 HUD 条（原 `SlackerProfile`） |
| `src/components/ChatThread.tsx` | 气泡对话 + Mascot + 快捷 chip（原 `RoastPanel`） |
| `src/components/BattleEmpty.tsx` | 待办战场空状态 |
| `src/components/TaskItem.tsx` | 关卡式任务卡片（腐败条 + 抓捕区） |
| `src/components/AiMascot.tsx` | SVG 吉祥物（霓虹渐变） |
| `src/components/EscapingCheckbox.tsx` | 逃跑按钮（霓虹黄 + glitch） |
| `src/components/AnimatedNumber.tsx` | 画饼指数数字滚动动画 |
| `src/components/ConfettiBurst.tsx` | 「好吧算了」庆祝纸屑 |
| `src/components/OnboardingGuide.tsx` | 首次访问三步引导 |
| `src/utils/theme.ts` | 主题加载/切换（霓虹 / 深空） |
| `src/index.css` | 全局样式与设计 token（含 `[data-theme="void"]`） |

---

## 3. 设计方向

**概念：「聊天室 + 游戏 HUD」** — 已实现

- 左侧：**AI 对话区** — 提交 = 发消息，抬杠 = 气泡，操作 = chip
- 右侧：**待办战场** — 任务 = 关卡卡片
- 底部：**HUD 条** — 画饼指数与四项统计

---

## 4. 目标布局（To-Be · 已实现）

```
┌─────────────────────────────────────────────────┐
│  赛博抬杠待办              [本地模式] [⚙]        │
├──────────────────────┬──────────────────────────┤
│   AI 对话区           │   待办战场                │
│   [Mascot 72px]      │   [BattleCard × N]       │
│   [气泡流]            │   [BattleEmpty]          │
│   [输入 + 发送]       │                          │
├──────────────────────┴──────────────────────────┤
│  🛡劝退 🏃逃跑 📅甩锅 💀完成 · 画饼指数 · 档案▴   │
└─────────────────────────────────────────────────┘
```

### 4.1 布局要点 — 落地情况

| 要点 | 状态 | 实现 |
|------|------|------|
| 档案卡 → HUD 条 | ✅ | `HudBar`，点击展开 subtitle / footnote |
| 左侧对话为主 | ✅ | `ChatThread` + 底部 `composer-form` |
| 右侧任务战场 | ✅ | `battle-stage` + `TaskItem` |
| 去掉 Footer | ✅ | slogan 移至 `BattleEmpty` / Mascot  idle 台词 |
| Mobile Tab | ✅ | `mobile-tabs`：抬杠 / 待办；加任务后自动切待办 |

### 4.2 响应式 — 落地情况

| 断点 | 布局 | 状态 |
|------|------|------|
| Desktop ≥840px | 45% / 55% 双栏 | ✅ `.stage-grid` |
| Tablet / Mobile | Tab 切换单栏 | ✅ `.mobile-tabs` |
| 逃跑区高度 | ≥120px | ✅ `EscapingCheckbox` 默认 + `TaskItem` min |

---

## 5. 视觉系统（已实现）

### 5.1 配色 token（`src/index.css` `:root`）

```css
--bg: #0a0a0f;
--surface: #14141c;
--neon-cyan: #00f5d4;
--neon-pink: #ff006e;
--neon-yellow: #ffbe0b;
--text: #e8e8f0;
--text-dim: #6b6b80;
```

- 实色 `.surface-card` + 霓虹描边，无 glass 拟态
- 主按钮 `--neon-cyan`，强调 chip `--neon-pink`，逃跑按钮 `--neon-yellow`

### 5.2 字体 — 已实现

| 用途 | 字体 | CSS 变量 |
|------|------|----------|
| 标题 | ZCOOL KuaiLe | `--font-display` |
| 正文 | Noto Sans SC | `--font` |
| 数字/指数 | JetBrains Mono | `--font-mono` |

### 5.3 Mascot 状态 — 已实现

| 状态 | 条件 | CSS 类 |
|------|------|--------|
| 空闲 | 无会话 | `ai-mascot--idle` |
| 思考 | loading 无文本 | `ai-mascot--thinking` |
| 抬杠 | loading 流式 | `ai-mascot--roasting` |
| 得意 | 显示操作 chip | `ai-mascot--smug` |
| 震惊 | 第二次坚持 | `ai-mascot--shocked` |

---

## 6. 组件规格（已实现）

### 6.1 `ChatThread`（原 `RoastPanel`）

| 特性 | 实现 |
|------|------|
| 气泡式对话 | `.chat-bubble--user` / `--ai` |
| 快捷回复 chip | `.chat-chips`：好吧算了 / 我偏要加 |
| 会话历史 | `App` 中 `chatMessages` 数组 |
| 流式输出 | 流式期间单独气泡 + `.is-streaming` 光标 |
| 二次坚持 | `attemptCount >= 2` →「我就是要加！！！」+ `.chip-pulse` |

### 6.2 `TaskItem` / BattleCard

- 顶部 `.battle-rot` 腐败条 + 标签
- `.capture-zone` + `.capture-label`「抓捕区」
- `.escape-arena--glitch`：逃跑 >5 次触发
- 入列动画 `.slide-in-right`

### 6.3 `HudBar`（原 `SlackerProfile`）

- 固定底部 `.hud-bar`
- 紧凑行：四项统计 chip + 画饼进度条 + 称号
- 点击 `.hud-compact` 展开 `.hud-expanded`

### 6.4 空状态 — `BattleEmpty`

- 64px Mascot +「清单比你的脸还干净」+ 引导文案

---

## 7. 交互动效 — 落地情况

| 场景 | 状态 | 实现 |
|------|------|------|
| 提交任务 | ✅ | 用户气泡 `fly-in-right` |
| AI 抬杠 | ✅ | Mascot shake + 气泡 `fadeUp` |
| 我偏要加 | ✅ | `.chip-pulse`（第二次） |
| 任务入列 | ✅ | `.slide-in-right` |
| 抓住按钮 | ✅ | `caught-pop` |
| 画饼指数变化 | ✅ | `AnimatedNumber` 数字滚动 + 进度条 transition |
| 好吧算了 confetti | ✅ | `ConfettiBurst` 从对话区中心爆发 |
| 首次访问引导 | ✅ | `OnboardingGuide` 三步聚光灯 + localStorage |
| 主题切换 | ✅ | 顶栏按钮：霓虹 ↔ 深空，`data-theme` |

---

## 8. 实施分期

### Phase 1 — 布局 + 气质

- [x] 重构 `App.tsx`：双栏 + 底部 HUD
- [x] 新配色 token，减少 glass 效果
- [x] `SlackerProfile` → `HudBar`
- [x] 清理 `index.css` 废弃类

### Phase 2 — 对话体验

- [x] `RoastPanel` → `ChatThread`
- [x] Mascot 放大并常驻左侧（72px）
- [x] 空状态重做（`BattleEmpty`）

### Phase 3 — 任务卡片游戏化

- [x] `TaskItem` 腐败条 + 抓捕区视觉
- [x] 基础动效（fadeUp、shake、slide-in-right、glitch）

### Phase 4 — Polish

- [x] 画饼指数数字滚动动画（`AnimatedNumber`）
- [x] 首次访问引导（`OnboardingGuide`，localStorage `chaotic-onboarding-v1`）
- [x] 霓虹 / 深空主题切换（`utils/theme.ts`，顶栏按钮）
- [x] 好吧算了 confetti 动效（`ConfettiBurst`）

---

## 9. Before / After 对比

| | 改版前 | 改版后 |
|---|--------|--------|
| 第一印象 | 深色 Todo 仪表盘 | AI 抬杠聊天室 |
| 主操作 | 表单提交 | 发消息式输入 |
| 核心玩法 | 卡片底部小区域 | 抓捕区 + 腐败条 |
| 统计 | 首屏四个 0 | 底部 HUD |
| 品牌 | 弱 | Mascot + 霓虹赛博 |

---

## 10. 变更日志

| 日期 | 变更 | 阶段 |
|------|------|------|
| 2026-07-03 | 初版方案写入文档 | — |
| 2026-07-03 | 完成 Phase 1–3：新布局、ChatThread、HudBar、BattleCard、霓虹视觉 | Phase 1–3 |
| 2026-07-03 | 完成 Phase 4：数字滚动、新手引导、主题切换、confetti | Phase 4 |

---

## 11. 文档维护约定

后续 UI 改动时，请同步更新：

1. **§2 现状诊断** — 若某问题已解决，标注 ✅ 并简述实现方式
2. **§4–§6** — 已落地的项保持与代码一致（组件名、类名）
3. **§8 实施分期** — 勾选已完成 checkbox
4. **§10 变更日志** — 追加日期、摘要

**文档状态枚举：**

- `规划中` — 方案已定，代码未改
- `进行中` — 部分 Phase 已实施
- `已完成` — 全部 Phase 落地（或明确裁剪范围）
