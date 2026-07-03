export type ThemeId = 'dark' | 'void'

const STORAGE_KEY = 'chaotic-theme'

export function loadTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'void' || saved === 'dark') return saved
  } catch {
    // ignore
  }
  return 'dark'
}

export function saveTheme(theme: ThemeId) {
  localStorage.setItem(STORAGE_KEY, theme)
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme
}

export function toggleTheme(current: ThemeId): ThemeId {
  return current === 'dark' ? 'void' : 'dark'
}

export function getThemeLabel(theme: ThemeId): string {
  return theme === 'dark' ? '深空' : '霓虹'
}
