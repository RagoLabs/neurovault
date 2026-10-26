import { useEffect } from 'react'
import { useDemoStore } from '@/stores/demoStore'

export type ResolvedTheme = 'light' | 'dark'

export function resolveTheme(pref: 'light' | 'dark' | 'system'): ResolvedTheme {
  if (pref === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return pref
}

export function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem('neurovault.theme', theme)
  } catch {
    /* ignore */
  }
}

export function useTheme() {
  const pref = useDemoStore((s) => s.preferences.theme)
  const setPreferences = useDemoStore((s) => s.setPreferences)
  const resolved = typeof window !== 'undefined' ? resolveTheme(pref) : 'light'

  useEffect(() => {
    applyTheme(resolveTheme(pref))
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [pref])

  return {
    theme: pref,
    resolved,
    setTheme: (t: 'light' | 'dark' | 'system') => setPreferences({ theme: t }),
    toggle: () => setPreferences({ theme: resolved === 'dark' ? 'light' : 'dark' }),
  }
}
