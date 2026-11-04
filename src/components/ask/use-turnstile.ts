import { useCallback, useEffect, useRef } from 'react'

// Mounts a Cloudflare Turnstile widget after hydration and hands out its
// token. Tokens are single use, so reset() after a question that reached the
// model. Without a site key the hook does nothing and getToken() resolves to
// undefined, which the server treats as unverified for uncached questions.

type Turnstile = {
  render(container: HTMLElement, options: Record<string, unknown>): string
  reset(widgetId?: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const SCRIPT_ID = 'turnstile-script'
const TOKEN_WAIT_MS = 6000

let scriptLoading: Promise<Turnstile | undefined> | undefined

function loadTurnstile(): Promise<Turnstile | undefined> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptLoading ??= new Promise((resolve) => {
    const existing = document.getElementById(SCRIPT_ID)
    const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script')
    script.addEventListener('load', () => resolve(window.turnstile))
    script.addEventListener('error', () => resolve(undefined))
    if (!existing) {
      script.id = SCRIPT_ID
      script.src = SCRIPT_URL
      script.async = true
      document.head.append(script)
    }
  })
  return scriptLoading
}

export function useTurnstile(siteKey: string | undefined) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string>(undefined)
  const token = useRef<string | undefined>(undefined)
  const waiting = useRef<((token: string | undefined) => void)[]>([])

  const settle = useCallback((value: string | undefined) => {
    token.current = value
    for (const resolve of waiting.current.splice(0)) resolve(value)
  }, [])

  useEffect(() => {
    const element = container.current
    if (!siteKey || !element) return
    let cancelled = false
    void loadTurnstile().then((turnstile) => {
      if (cancelled || !turnstile) return
      widgetId.current = turnstile.render(element, {
        sitekey: siteKey,
        theme: 'auto',
        size: 'flexible',
        callback: (value: string) => settle(value),
        'expired-callback': () => settle(undefined),
        'error-callback': () => settle(undefined),
      })
    })
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
    }
  }, [siteKey, settle])

  const getToken = useCallback((): Promise<string | undefined> => {
    if (!siteKey) return Promise.resolve(undefined)
    if (token.current) return Promise.resolve(token.current)
    return new Promise((resolve) => {
      waiting.current.push(resolve)
      setTimeout(() => resolve(undefined), TOKEN_WAIT_MS)
    })
  }, [siteKey])

  const reset = useCallback(() => {
    token.current = undefined
    if (widgetId.current) window.turnstile?.reset(widgetId.current)
  }, [])

  return { container, getToken, reset }
}
