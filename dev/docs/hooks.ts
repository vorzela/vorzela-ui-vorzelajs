import { effect, onCleanup, signal, type Accessor } from '@vorzelajs/core'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'vz-theme'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  // Deep-link a theme for screenshots and QA: ?theme=dark
  const forced = new URLSearchParams(window.location.search).get('theme')
  if (forced === 'light' || forced === 'dark') return forced

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage blocked */
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Light/dark theme persisted in localStorage and applied to `<html>`.
 * The class toggle is an effect, so the DOM stays in sync without a re-render.
 */
export function useTheme(): { theme: Accessor<Theme>; toggle: () => void } {
  const [theme, setTheme] = signal<Theme>(readTheme())

  effect(() => {
    if (typeof document === 'undefined') return
    const current = theme()
    const root = document.documentElement
    root.classList.toggle('dark', current === 'dark')
    root.style.colorScheme = current

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', current === 'dark' ? '#090d15' : '#f6f7f9')

    try {
      window.localStorage.setItem(STORAGE_KEY, current)
    } catch {
      /* storage blocked */
    }
  })

  return {
    theme,
    toggle: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }
}

export interface Route {
  path: string
  segments: string[]
}

function parseHash(): Route {
  const hash = window.location.hash
  // In-page anchors (the skip link, heading links) must not tear down the
  // route. Only `#/…` is a route; anything else resolves to the overview.
  if (hash && !hash.startsWith('#/')) {
    return { path: '', segments: [] }
  }

  const raw = hash.replace(/^#\/?/, '')
  const path = raw.split('?')[0] ?? ''
  const segments = path.split('/').filter(Boolean)
  return { path: segments.join('/'), segments }
}

/**
 * Hash-based router. Keeps deep links shareable without a server rewrite and
 * returns an accessor so the outlet re-creates only the page that changed.
 */
export function useRoute(): Accessor<Route> {
  const [route, setRoute] = signal<Route>(parseHash())

  effect(() => {
    const onChange = () => {
      const hash = window.location.hash
      // Keep the current page when a plain fragment (#main, #section) is used.
      if (hash && !hash.startsWith('#/')) return
      setRoute(parseHash())
    }
    window.addEventListener('hashchange', onChange)
    onCleanup(() => window.removeEventListener('hashchange', onChange))
  })

  return route
}

export function navigate(path: string): void {
  window.location.hash = `#/${path.replace(/^\/+/, '')}`
}

export function slugFor(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}
