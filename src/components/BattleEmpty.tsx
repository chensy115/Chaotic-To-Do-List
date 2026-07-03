import { AiMascot } from './AiMascot'

export function BattleEmpty() {
  return (
    <div className="battle-empty surface-card animate-in">
      <AiMascot mood="idle" size={64} />
      <p className="battle-empty-title">清单比你的脸还干净</p>
      <p className="battle-empty-sub">左边发一条任务，看我怎么怼你 →</p>
    </div>
  )
}
