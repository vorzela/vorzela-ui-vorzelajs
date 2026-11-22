/**
 * components/ui/popover.tsx
 *
 * Viewport-aware popover. Focus-trapped, portal-rendered, and scroll/resize safe.
 */
import { effect, onCleanup, signal, type Accessor } from '@vorzelajs/core'
import {
  createContext,
  getHost,
  Show,
  useContext,
} from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import { trapFocus } from '../../lib/overlay.ts'
import type { ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import styles from './popover.module.scss'

export type PopoverAlign = 'start' | 'center' | 'end'
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right'

interface PopoverContextValue {
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
  trigger: Accessor<HTMLElement | null>
  setTrigger: (node: HTMLElement | null) => void
  contentId: string
}

const PopoverContext = createContext<PopoverContextValue | null>(
  null,
  'popover',
)

function usePopover(): PopoverContextValue {
  const context = useContext(PopoverContext)
  if (!context) {
    throw new Error('Popover components must be used within <Popover>')
  }
  return context
}

function isElementLike(value: unknown): value is Element {
  if (!getHost().isNode(value)) return false
  return (
    typeof (value as { setAttribute?: unknown }).setAttribute === 'function'
  )
}

function hasListeners(node: Element): boolean {
  return (
    typeof (node as { addEventListener?: unknown }).addEventListener ===
    'function'
  )
}

function toggleOnKey(
  event: KeyboardEvent,
  open: Accessor<boolean>,
  setOpen: (open: boolean) => void,
): void {
  if (event.defaultPrevented) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    setOpen(!open())
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!open()) setOpen(true)
  }
}

function setupChildTrigger(
  node: Element,
  context: PopoverContextValue,
): void {
  context.setTrigger(node as unknown as HTMLElement)

  effect(() => {
    node.setAttribute('aria-haspopup', 'dialog')
    node.setAttribute('aria-expanded', String(context.open()))
    if (context.open()) node.setAttribute('aria-controls', context.contentId)
    else node.removeAttribute('aria-controls')
  })

  const canListen = hasListeners(node)
  const onClick = (event: Event): void => {
    if (!event.defaultPrevented) context.setOpen(!context.open())
  }
  const onKeyDown = (event: Event): void => {
    toggleOnKey(event as KeyboardEvent, context.open, context.setOpen)
  }

  if (canListen) {
    node.addEventListener('click', onClick)
    node.addEventListener('keydown', onKeyDown)
  }

  onCleanup(() => {
    if (canListen) {
      node.removeEventListener('click', onClick)
      node.removeEventListener('keydown', onKeyDown)
    }
    node.removeAttribute('aria-haspopup')
    node.removeAttribute('aria-expanded')
    node.removeAttribute('aria-controls')
    context.setTrigger(null)
  })
}

export interface PopoverProps {
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Present for API parity; popovers are never modal. */
  modal?: boolean
  children?: ReactNode
}

/**
 * Vorzela evaluates JSX eagerly, so compound parts must be a function child:
 * `<Popover>{() => <><PopoverTrigger /><PopoverContent /></>}</Popover>`.
 */
export function Popover({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = signal(defaultOpen)
  const controlledOpen = open === undefined ? null : accessorOf(open)
  const isOpen = (): boolean =>
    controlledOpen ? controlledOpen() : uncontrolledOpen()

  const setOpen = (next: boolean): void => {
    if (!controlledOpen) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const [trigger, setTrigger] = signal<HTMLElement | null>(null)
  const contentId = useId('popover-content')

  const value: PopoverContextValue = {
    open: isOpen,
    setOpen,
    trigger,
    setTrigger,
    contentId,
  }

  return (
    <PopoverContext.Provider value={value}>
      {() => (
        <div className={styles.wrapper}>
          {typeof children === 'function'
            ? (children as () => ReactNode)()
            : children}
        </div>
      )}
    </PopoverContext.Provider>
  )
}

export interface PopoverTriggerProps {
  asChild?: boolean
  children: ReactNode
}

export function PopoverTrigger({
  asChild = true,
  children,
}: PopoverTriggerProps) {
  const context = usePopover()

  if (asChild && isElementLike(children)) {
    setupChildTrigger(children, context)
    return children
  }

  onCleanup(() => context.setTrigger(null))

  return (
    <button
      ref={(element) => context.setTrigger(element as HTMLElement)}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={() => String(context.open())}
      aria-controls={() => (context.open() ? context.contentId : undefined)}
      onClick={(event) => {
        if (!event.defaultPrevented) context.setOpen(!context.open())
      }}
      onKeyDown={(event) =>
        toggleOnKey(event, context.open, context.setOpen)
      }
    >
      {children}
    </button>
  )
}

export interface PopoverContentProps {
  align?: PopoverAlign
  side?: PopoverSide
  sideOffset?: number
  className?: string
  children?: ReactNode
  avoidCollisions?: boolean
  /** Accessible name for the dialog panel. */
  ariaLabel?: string
}

interface Position {
  top: number
  left: number
}

export function PopoverContent({
  align = 'center',
  side = 'bottom',
  sideOffset = 8,
  className,
  children,
  avoidCollisions = true,
  ariaLabel = 'Popover',
}: PopoverContentProps) {
  const context = usePopover()
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

    let nextSide = side
    if (avoidCollisions) {
      const space: Record<PopoverSide, number> = {
        top: tr.top,
        bottom: vh - tr.bottom,
        left: tr.left,
        right: vw - tr.right,
      }
      const required =
        nextSide === 'top' || nextSide === 'bottom'
          ? ch + sideOffset
          : cw + sideOffset

      if (space[nextSide] < required) {
        const opposite: Record<PopoverSide, PopoverSide> = {
          top: 'bottom',
          bottom: 'top',
          left: 'right',
          right: 'left',
        }
        if (space[opposite[nextSide]] >= space[nextSide]) {
          nextSide = opposite[nextSide]
        }
      }
    }

    let top = 0
    let left = 0

    if (nextSide === 'bottom') {
      top = tr.bottom + sideOffset
      left =
        align === 'start'
          ? tr.left
          : align === 'end'
            ? tr.right - cw
            : tr.left + tr.width / 2 - cw / 2
    } else if (nextSide === 'top') {
      top = tr.top - ch - sideOffset
      left =
        align === 'start'
          ? tr.left
          : align === 'end'
            ? tr.right - cw
            : tr.left + tr.width / 2 - cw / 2
    } else if (nextSide === 'right') {
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

    if (avoidCollisions) {
      if (left < margin) left = margin
      if (left + cw > vw - margin) left = vw - cw - margin
      if (top < margin) top = margin
      if (top + ch > vh - margin) top = vh - ch - margin
    }

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

  effect(() => {
    const panel = content()
    if (!context.open() || !panel || typeof document === 'undefined') return
    const release = trapFocus(panel, () => context.setOpen(false))
    onCleanup(release)
  })

  effect(() => {
    if (!context.open() || typeof document === 'undefined') return

    const handler = (event: PointerEvent): void => {
      const target = event.target as Node
      if (
        context.trigger()?.contains(target) ||
        content()?.contains(target)
      ) {
        return
      }
      context.setOpen(false)
    }

    const id = setTimeout(
      () => document.addEventListener('pointerdown', handler),
      0,
    )
    onCleanup(() => {
      clearTimeout(id)
      document.removeEventListener('pointerdown', handler)
    })
  })

  effect(() => {
    if (!context.open() || typeof document === 'undefined') return

    const handler = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      context.setOpen(false)
      context.trigger()?.focus({ preventScroll: true })
    }

    document.addEventListener('keydown', handler, { capture: true })
    onCleanup(() =>
      document.removeEventListener('keydown', handler, { capture: true }),
    )
  })

  return (
    <Show when={context.open}>
      {() => {
        const panel = (
          <Portal>
            <div
              ref={(element) => setContent(element as HTMLDivElement)}
              id={context.contentId}
              role="dialog"
              aria-modal="false"
              aria-label={ariaLabel}
              tabIndex={-1}
              data-state="open"
              style={() => ({
                position: 'fixed',
                top: `${pos().top}px`,
                left: `${pos().left}px`,
                visibility: positioned() ? 'visible' : 'hidden',
              })}
              className={cx(styles.content, className)}
              onClick={(event) => event.stopPropagation()}
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

export function PopoverClose({ children }: { children: ReactNode }) {
  const context = usePopover()

  if (isElementLike(children)) {
    const node = children
    const canListen = hasListeners(node)
    const onClick = (event: Event): void => {
      if (!event.defaultPrevented) context.setOpen(false)
    }

    if (canListen) node.addEventListener('click', onClick)
    onCleanup(() => {
      if (canListen) node.removeEventListener('click', onClick)
    })

    return children
  }

  return <span onClick={() => context.setOpen(false)}>{children}</span>
}

export function PopoverArrow({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="5"
      viewBox="0 0 10 5"
      className={cx(styles.arrow, className)}
      aria-hidden="true"
    >
      <path d="M0 5L5 0L10 5H0Z" />
    </svg>
  )
}
