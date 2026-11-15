import { effect, onCleanup, signal } from '@vorzelajs/core'
import { createContext, For, Portal, useContext } from '@vorzelajs/dom'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import { Bell, CircleAlert, CircleCheck, Info, TriangleAlert, X } from './icons.tsx'
import type { LucideIcon } from './icons.tsx'
import styles from './sonner.module.scss'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: ToastType
  duration?: number
  action?: { label: string; onClick: () => void }
}

export interface ToasterContextValue {
  toast: (toast: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

const ToasterContext = createContext<ToasterContextValue | null>(null, 'toaster')

/** The most recently mounted toaster, used by the imperative `toast`. */
let activeToaster: ToasterContextValue | null = null

export function useToast(): ToasterContextValue {
  const context = useContext(ToasterContext)
  if (!context) throw new Error('useToast must be used within <Toaster>')
  return context
}

export type ToasterPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'

const POSITION: Record<ToasterPosition, string> = {
  'top-left': styles.topLeft,
  'top-right': styles.topRight,
  'top-center': styles.topCenter,
  'bottom-left': styles.bottomLeft,
  'bottom-right': styles.bottomRight,
  'bottom-center': styles.bottomCenter,
}

const TYPE: Record<ToastType, string> = {
  default: styles.default,
  success: styles.success,
  error: styles.error,
  warning: styles.warning,
  info: styles.info,
}

const TYPE_ICON: Record<ToastType, LucideIcon> = {
  default: Bell,
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
}

export function Toaster({
  position = 'bottom-right',
  children,
}: {
  position?: ToasterPosition
  children?: ReactNode
}) {
  const [toasts, setToasts] = signal<Toast[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const dismiss = (id: string): void => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    setToasts((previous) => previous.filter((item) => item.id !== id))
  }

  const toast = (input: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).slice(2, 9)
    const duration = input.duration ?? 4000
    const item: Toast = { ...input, id, duration }
    setToasts((previous) => [...previous, item])

    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration)
      timer.unref?.()
      timers.set(id, timer)
    }
    return id
  }

  const value: ToasterContextValue = { toast, dismiss }

  effect(() => {
    activeToaster = value
    onCleanup(() => {
      if (activeToaster === value) activeToaster = null
    })
  })

  onCleanup(() => {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  })

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <Portal>
        <div className={cx(styles.viewport, POSITION[position])}>
          <For each={toasts} key={(item) => item.id}>
            {(item, index) => {
              const type = item.type ?? 'default'
              const Icon = TYPE_ICON[type]
              return (
                <div
                  className={cx(styles.toast, TYPE[type])}
                  role={type === 'error' ? 'alert' : 'status'}
                  aria-live={type === 'error' ? 'assertive' : 'polite'}
                  aria-atomic="true"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <span className={styles.typeIcon}>
                    <Icon aria-hidden />
                  </span>
                  <div className={styles.copy}>
                    {item.title ? <p className={styles.title}>{item.title}</p> : null}
                    {item.description ? (
                      <p className={styles.description}>{item.description}</p>
                    ) : null}
                  </div>
                  {item.action ? (
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => {
                        item.action?.onClick()
                        dismiss(item.id)
                      }}
                    >
                      {item.action.label}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.dismiss}
                    onClick={() => dismiss(item.id)}
                    aria-label="Dismiss notification"
                  >
                    <X aria-hidden />
                  </button>
                </div>
              )
            }}
          </For>
        </div>
      </Portal>
    </ToasterContext.Provider>
  )
}

/**
 * Imperative fallback for callers outside a component tree. Prefer
 * `useToast()` so the toast is rendered by the nearest <Toaster>.
 */
export function toast(input: Omit<Toast, 'id'>): string {
  if (activeToaster) return activeToaster.toast(input)
  console.warn('Use useToast() hook from Toaster context')
  return ''
}

export { Toaster as Sonner }
