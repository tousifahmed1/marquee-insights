export type Theme = 'dark' | 'light'

export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'marquee-theme'

// Runs in <head> before first paint. The server always renders the default
// theme so cached HTML is identical for everyone; this applies a saved choice.
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}})();`

export function parseTheme(value: string | null): Theme {
  return value === 'light' || value === 'dark' ? value : DEFAULT_THEME
}

export function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this page view.
  }
}
