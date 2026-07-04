import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { loadApiConfig, saveApiConfig } from './utils/apiConfig'
import { fetchServerAiStatus } from './utils/serverAi'
import { applyTheme, loadTheme } from './utils/theme'

applyTheme(loadTheme())

registerSW({ immediate: true })

async function bootstrap() {
  const status = await fetchServerAiStatus()
  if (status.available) {
    const cfg = loadApiConfig()
    if (!cfg.enabled) {
      saveApiConfig({ ...cfg, enabled: true })
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
