import type { Stats, Task } from '../types'

const AMBITIOUS = /健身|学习|早起|减肥|背单词|论文|雅思|考研|加班|复习/i

export function calcPieIndex(tasks: Task[], stats: Stats): number {
  const active = tasks.filter((t) => !t.completed)
  let score = active.length * 12
  score += stats.rejected * 4
  score += stats.snoozed * 6
  score += active.reduce((s, t) => s + (t.snoozeCount ?? 0) * 5, 0)
  score += active.filter((t) => AMBITIOUS.test(t.text)).length * 8
  score -= stats.completed * 10
  return Math.max(0, Math.min(100, score))
}

export function getSlackerTitle(stats: Stats, pieIndex: number): {
  title: string
  subtitle: string
  emoji: string
} {
  if (pieIndex >= 90) {
    return { title: '画饼宗师', subtitle: '你的待办清单可以上市融资了', emoji: '📈' }
  }
  if (pieIndex >= 70) {
    return { title: '口头自律王者', subtitle: '计划写得飞起，执行全靠缘分', emoji: '👑' }
  }
  if (stats.rejected >= 10) {
    return { title: '劝退免疫体', subtitle: 'AI 怼你十次，你反弹十一次', emoji: '🛡️' }
  }
  if (stats.escaped >= 50) {
    return { title: '按钮追逐赛冠军', subtitle: '鼠标跟完成键的马拉松选手', emoji: '🏃' }
  }
  if (stats.snoozed >= 8) {
    return { title: '明日复明日专家', subtitle: '「明天再说」是你的母语', emoji: '📅' }
  }
  if (stats.completed >= 5) {
    return { title: '反常人类', subtitle: '居然完成了这么多，可疑', emoji: '🚨' }
  }
  if (pieIndex <= 20) {
    return { title: '新晋摸鱼选手', subtitle: '还没开始画饼，保持这个势头（别加任务）', emoji: '🐟' }
  }
  return { title: '普通摆烂人', subtitle: '在劝退和倔强之间反复横跳', emoji: '😎' }
}

export function getPieComment(pieIndex: number): string {
  if (pieIndex >= 85) return '画饼浓度过高，建议立即躺平'
  if (pieIndex >= 60) return '清单很丰满，执行很骨感'
  if (pieIndex >= 35) return '有一定摆烂潜力，还可抢救'
  return '目前尚能自控，危险'
}
