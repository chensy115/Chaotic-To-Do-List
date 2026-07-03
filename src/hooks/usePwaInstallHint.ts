import { useEffect } from 'react'

const HINT_KEY = 'chaotic-pwa-hint-v1'

/** 浏览器支持安装时，首次提示可「添加到主屏幕」 */
export function usePwaInstallHint(onHint: (message: string) => void) {
  useEffect(() => {
    if (localStorage.getItem(HINT_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const onInstallable = () => {
      localStorage.setItem(HINT_KEY, '1')
      onHint('可添加到主屏幕，像 App 一样打开（地址栏或菜单 → 安装应用）')
    }

    window.addEventListener('beforeinstallprompt', onInstallable, { once: true })
    return () => window.removeEventListener('beforeinstallprompt', onInstallable)
  }, [onHint])
}
