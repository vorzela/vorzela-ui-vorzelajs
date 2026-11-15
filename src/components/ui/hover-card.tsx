/**
 * components/ui/hover-card.tsx
 *
 * Hover/focus triggered card. Delayed with leak-free timers.
 */
import { effect, onCleanup, signal, type Accessor } from '@vorzelajs/core'
import {
  createContext,
  getHost,
  Show,
  useContext,
} from '@vorzelajs/dom'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import styles from './hover-card.module.scss'

export type HoverCardAlign = 'start' | 'center' | 'end'
export type HoverCardSide = 'top' | 'bottom' | 'left' | 'right'

interface HoverCardContextValue {
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
  trigger: Accessor<HTMLElement | null>
  setTrigger: (node: HTMLElement | null) => void
  contentId: string
}

const HoverCardContext = createContext<HoverCardContextValue | null>(
  null,
  'hover-card',
)

function useHoverCard(): HoverCardContextValue {
  const context = useContext(HoverCardContext)
  if (!context) {
    throw new Error('HoverCard components must be used within <HoverCard>')
  }
  return context
}

function isElementLike(value: unknown): value is Element {
  if (!getHost().isNode(value)) return false
  return (
    typeof (value as { setAttribute?: unknown }).setAttribute === 'function'
  )
}

export interface HoverCardProps {
  openDelay?: number
  closeDelay?: number
  children?: ReactNode
}

/**
 * Vorzela evaluates JSX eagerly, so compound parts must be a function child:
 * `<HoverCard>{() => <><HoverCardTrigger /><HoverCardContent /></>}</HoverCard>`.
 */
export function HoverCard({
  openDelay = 200,
  closeDelay = 150,
  children,
}: HoverCardProps) {
  const [open, setOpen] = signal(false)
  const [trigger, setTrigger] = signal<HTMLElement | null>(null)
  const contentId = useId('hover-card-content')

  let openTimer: ReturnType<typeof setTimeout> | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  const openWithDelay = (): void => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    if (openTimer) clearTimeout(openTimer)
    openTimer = setTimeout(() => {
      openTimer = null
      setOpen(true)
    }, openDelay)
    openTimer.unref?.()
  }

  const closeWithDelay = (): void => {
    if (openTimer) {
      clearTimeout(openTimer)
      openTimer = null
    }
    if (closeTimer) clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      closeTimer = null
      setOpen(false)
    }, closeDelay)
    closeTimer.unref?.()
  }

  onCleanup(() => {
    if (openTimer) clearTimeout(openTimer)
    if (closeTimer) clearTimeout(closeTimer)
    openTimer = null
    closeTimer = null
  })

  const value: HoverCardContextValue = {
    open,
    setOpen: (next: boolean) => (next ? openWithDelay() : closeWithDelay()),
    trigger,
    setTrigger,
    contentId,
  }

  return (
    <HoverCardContext.Provider value={value}>
      {() => (
        <div
          className={styles.wrapper}
          onMouseEnter={openWithDelay}
          onMouseLeave={closeWithDelay}
          onFocusIn={openWithDelay}
          onFocusOut={closeWithDelay}
        >
          {typeof children === 'function'
            ? (children as () => unknown)()
            : children}
        </div>
      )}
    </HoverCardContext.Provider>
  )
}

export interface HoverCardTriggerProps {
  asChild?: boolean
  children: ReactNode
}

export function HoverCardTrigger({
  asChild = true,
  children,
}: HoverCardTriggerProps) {
  const context = useHoverCard()

  if (asChild && isElementLike(children)) {
    const node = children
    context.setTrigger(node as unknown as HTMLElement)

    effect(() => {
      if (context.open()) {
        node.setAttribute('aria-describedby', context.contentId)
      } else {
        node.removeAttribute('aria-describedby')
      }
    })

    onCleanup(() => {
      node.removeAttribute('aria-describedby')
      context.setTrigger(null)
    })

    return children
  }

  onCleanup(() => context.setTrigger(null))

  return (
    <span
      ref={(element) => context.setTrigger(element as HTMLElement)}
      aria-describedby={() =>
        context.open() ? context.contentId : undefined
      }
    >
      {children}
    </span>
  )
}

export interface HoverCardContentProps {
  align?: HoverCardAlign
  side?: HoverCardSide
  sideOffset?: number
  className?: string
  children?: ReactNode
}

interface Position {
  top: number
  left: number
}

export function HoverCardContent({
  align = 'center',
  side = 'bottom',
  sideOffset = 8,
  className,
  children,
}: HoverCardContentProps) {
  const context = useHoverCard()
  const [content, setContent] = signal<HTMLDivElement | null>(null)
  const [pos, setPos] = signal<Position>({ top: 0, left: 0 })
  const [positioned, setPositioned] = signal(false)

  const recompute = (
    trigger: HTMLElement,
    panel: HTMLDivElement,
  ): void => {
    const tr = trigger.getBoundingClientRect()
    const cw = panel.offsetWidth
    const ch = panel.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 8

    let top = 0
    let left = 0

    if (side === 'bottom') {
      top = tr.bottom + sideOffset
      left =
        align === 'start'
          ? tr.left
          : align === 'end'
            ? tr.right - cw
            : tr.left + tr.width / 2 - cw / 2
    } else if (side === 'top') {
      top = tr.top - ch - sideOffset
      left =
        align === 'start'
          ? tr.left
          : align === 'end'
            ? tr.right - cw
            : tr.left + tr.width / 2 - cw / 2
    } else if (side === 'right') {
      top =
        align === 'start'
          ? tr.top
          : align === 'end'
            ? tr.bottom - ch
            : tr.top + tr.height / 2 - ch / 2
      left = tr.right + sideOffset
    } else {
      top =
        align === 'start'
          ? tr.top
          : align === 'end'
            ? tr.bottom - ch
            : tr.top + tr.height / 2 - ch / 2
      left = tr.left - cw - sideOffset
    }

    if (left < margin) left = margin
    if (left + cw > vw - margin) left = vw - cw - margin
    if (top < margin) top = margin
    if (top + ch > vh - margin) top = vh - ch - margin

    setPos({ top, left })
    setPositioned(true)
  }

  effect(() => {
    const panel = content()
    const trigger = context.trigger()

    if (!context.open()) {
      setPositioned(false)
      return
    }
    if (!panel || !trigger || typeof window === 'undefined') return

    const update = (): void => recompute(trigger, panel)
    const frame = requestAnimationFrame(update)

    window.addEventListener('scroll', update, { passive: true, capture: true })
    window.addEventListener('resize', update, { passive: true })
    onCleanup(() => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update, { capture: true })
      window.removeEventListener('resize', update)
    })
  })

  return (
    <Show when={context.open}>
      {() => {
        const panel = (
          <Portal>
            <div
              ref={(element) => setContent(element as HTMLDivElement)}
              id={context.contentId}
              role="tooltip"
              style={() => ({
                position: 'fixed',
                top: `${pos().top}px`,
                left: `${pos().left}px`,
                visibility: positioned() ? 'visible' : 'hidden',
              })}
              className={cx(styles.content, className)}
            >
              {children}
            </div>
          </Portal>
        )

        onCleanup(() => setContent(null))
        return panel
      }}
    </Show>
  )
}
