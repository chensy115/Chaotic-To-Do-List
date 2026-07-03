import { useEffect, useState } from 'react'
import type { PersonalityId } from '../types'
import {
  applyProviderPreset,
  isQwenLike,
  isSlowQwenModel,
  loadApiConfig,
  maskApiKey,
  PROVIDER_PRESETS,
  saveApiConfig,
  type ApiConfig,
  type ApiProvider,
} from '../utils/apiConfig'
import { PERSONALITY_OPTIONS } from '../utils/personality'
import { testApiConnection } from '../utils/aiRoast'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (config: ApiConfig) => void
}

export function ApiSettings({ open, onClose, onSaved }: Props) {
  const [config, setConfig] = useState<ApiConfig>(loadApiConfig)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (open) {
      setConfig(loadApiConfig())
      setTestResult(null)
    }
  }, [open])

  if (!open) return null

  const handleProviderChange = (provider: ApiProvider) => {
    setConfig(applyProviderPreset(provider, config))
    setTestResult(null)
  }

  const handleSave = () => {
    saveApiConfig(config)
    onSaved(config)
    onClose()
  }

  const handlePersonalityChange = (personality: PersonalityId) => {
    const next = { ...config, personality }
    setConfig(next)
    saveApiConfig(next)
    onSaved(next)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testApiConnection(config)
    setTestResult(result)
    setTesting(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🧠 AI 接口配置</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body">
          <label className="field-toggle">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            <span>启用真实 AI 抬杠</span>
          </label>

          <label className="field">
            <span>服务商</span>
            <select
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value as ApiProvider)}
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">自定义</option>
            </select>
            {config.provider !== 'custom' && (
              <small>{PROVIDER_PRESETS[config.provider].hint}</small>
            )}
          </label>

          <label className="field">
            <span>API Key</span>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => {
                setConfig({ ...config, apiKey: e.target.value })
                setTestResult(null)
              }}
              placeholder="sk-..."
              autoComplete="off"
            />
            {config.apiKey && (
              <small>已保存预览：{maskApiKey(config.apiKey)}</small>
            )}
          </label>

          <label className="field">
            <span>Base URL</span>
            <input
              type="url"
              value={config.baseUrl}
              onChange={(e) => {
                setConfig({ ...config, baseUrl: e.target.value, provider: 'custom' })
                setTestResult(null)
              }}
              placeholder="https://api.deepseek.com/v1"
            />
          </label>

          <label className="field">
            <span>模型</span>
            <input
              type="text"
              value={config.model}
              onChange={(e) => {
                setConfig({ ...config, model: e.target.value, provider: 'custom' })
                setTestResult(null)
              }}
              placeholder="qwen-flash"
            />
            {isQwenLike(config) && isSlowQwenModel(config.model) && (
              <small className="warn-text">
                ⚠️ {config.model} 是大模型，响应偏慢。抬杠场景推荐 qwen-flash 或 qwen-turbo
              </small>
            )}
          </label>

          <div className="field">
            <span>NPC 人格</span>
            <small className="field-hint">点选后立即生效，无需再点保存</small>
            <div className="personality-options" role="radiogroup" aria-label="NPC 人格">
              {PERSONALITY_OPTIONS.map(({ id, label, hint }) => (
                <label key={id} className="personality-option">
                  <input
                    type="radio"
                    name="personality"
                    value={id}
                    checked={config.personality === id}
                    onChange={() => handlePersonalityChange(id)}
                  />
                  <span className="personality-option-text">
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {isQwenLike(config) && (
            <label className="field-toggle">
              <input
                type="checkbox"
                checked={config.enableThinking}
                onChange={(e) => setConfig({ ...config, enableThinking: e.target.checked })}
              />
              <span>启用深度思考（更慢，思考完才出字）</span>
            </label>
          )}

          <label className="field-toggle">
            <input
              type="checkbox"
              checked={config.fullAiMode}
              onChange={(e) => setConfig({ ...config, fullAiMode: e.target.checked })}
              disabled={!config.enabled}
            />
            <span>完成 / 甩锅也用 AI（更耗 Key）</span>
          </label>
          {config.fullAiMode && (
            <p className="modal-note modal-note--inline">
              开启后，完成打卡和甩锅时的战报也会调用 API；失败时自动降级本地台词。
            </p>
          )}

          {testResult && (
            <div className={`test-result ${testResult.ok ? 'ok' : 'err'}`}>
              {testResult.ok ? '✓' : '✗'} {testResult.message}
            </div>
          )}

          <p className="modal-note">
            Key 保存在浏览器 localStorage，经本地代理转发，不会暴露给第三方网站。
            也可在项目根目录创建 <code>.env</code> 配置 <code>VITE_OPENAI_API_KEY</code>。
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-soft" onClick={handleTest} disabled={testing}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          <button type="button" className="btn btn-accent" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
