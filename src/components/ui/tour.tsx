import { effect, onCleanup, signal } from '@vorzelajs/core'
import { Portal, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Button } from './button.tsx'
import { X } from './icons.tsx'
import styles from './tour.module.scss'
import type { CSSProperties, ReactNode } from '../../types.ts'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

export type TourStep = {
  id: string
  /** CSS selector or a function that returns the element to highlight. */
  target: string | (() => HTMLElement | null)
  title: ReactNode
  description?: ReactNode
  placement?: TourPlacement
  image?: string
  action?: { label: string; onClick: () => void }
}

export interface TourProps {
  steps: TourStep[] | (() => TourStep[])
  open: boolean | (() => boolean)
  onOpenChange?: (open: boolean) => void
  onFinish?: () => void
  current?: number | (() => number)
  defaultCurrent?: number
  onStepChange?: (index: number) => void
  maskClosable?: boolean
  showSkip?: boolean
  scrollIntoView?: boolean
  className?: string
}

type Rect = {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
}

const GAP = 12
const EDGE = 16

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

/** Guided product tour with a highlighted target and keyboard controls. */
export function Tour({
  steps: stepsProp,
  open,
  onOpenChange,
  onFinish,
  current,
  defaultCurrent = 0,
  onStepChange,
  maskClosable = false,
  showSkip = true,
  scrollIntoView = true,
  className,
}: TourProps) {
  const steps = accessorOf(stepsProp)
  const isOpen = accessorOf(open)
  const controlledCurrent = current === undefined ? null : accessorOf(current)
  const [internal, setInternal] = signal(defaultCurrent)
  const [rect, setRect] = signal<Rect | null>(null)
  const nextRef: { current: HTMLButtonElement | null } = { current: null }

  const index = (): number =>
    clamp(
      controlledCurrent ? controlledCurrent() : internal(),
      0,
      Math.max(0, steps().length - 1),
    )
  const step = (): TourStep | undefined => steps()[index()]

  const setOpen = (next: boolean): void => {
    onOpenChange?.(next)
  }

  const go = (next: number): void => {
    const bounded = clamp(next, 0, steps().length - 1)
    if (!controlledCurrent) setInternal(bounded)
    onStepChange?.(bounded)
  }

  const finish = (): void => {
    setOpen(false)
    onFinish?.()
  }

  effect(() => {
    if (typeof window === 'undefined') return
    if (!isOpen()) {
      setRect(null)
      return
    }

    const currentStep = step()
    if (!currentStep) {
      setRect(null)
      return
    }

    let element: HTMLElement | null = null
    try {
      element =
        typeof currentStep.target === 'function'
          ? currentStep.target()
          : document.querySelector<HTMLElement>(currentStep.target)
    } catch {
      element = null
    }

    if (!element) {
      setRect(null)
      return
    }

    if (scrollIntoView && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }

    let frame = 0
    const update = (): void => {
      frame = 0
      const box = element!.getBoundingClientRect()
      setRect({
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        bottom: box.bottom,
        right: box.right,
      })
    }
    const schedule = (): void => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    onCleanup(() => {
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    })
  })

  effect(() => {
    if (typeof window === 'undefined' || !isOpen()) return
    const handleKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (index() >= steps().length - 1) finish()
        else go(index() + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        go(index() - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    onCleanup(() => window.removeEventListener('keydown', handleKey))
  })

  effect(() => {
    if (typeof window === 'undefined' || !isOpen()) return
    // Track the step so the freshly rebuilt Next button receives focus.
    index()
    const frame = window.requestAnimationFrame(() => nextRef.current?.focus())
    onCleanup(() => {
      window.cancelAnimationFrame(frame)
      nextRef.current = null
    })
  })

  const position = (): CSSProperties | null => {
    if (typeof window === 'undefined') return null
    if (!rect()) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const box = rect()!
    const width = Math.min(320, window.innerWidth - EDGE * 2)
    const placement =
      step()?.placement ?? (box.top > 240 ? 'top' : 'bottom')
    const centerX = clamp(
      box.left + box.width / 2 - width / 2,
      EDGE,
      window.innerWidth - width - EDGE,
    )
    const centerY = clamp(
      box.top + box.height / 2 - 120,
      EDGE,
      window.innerHeight - 260,
    )

    switch (placement) {
      case 'top':
        return {
          left: centerX,
          bottom: window.innerHeight - box.top + GAP,
        }
      case 'left':
        return {
          top: centerY,
          right: window.innerWidth - box.left + GAP,
        }
      case 'right':
        return {
          top: centerY,
          left: box.right + GAP,
        }
      default:
        return {
          left: centerX,
          top: box.bottom + GAP,
        }
    }
  }

  return (
    <Show when={() => isOpen() && Boolean(step())}>
      {() => {
        const activeStep = step()
        if (!activeStep) return null
        const total = steps().length
        const currentIndex = index()

        return (
          <Portal>
            <div
              className={styles.mask}
              onClick={() => {
                if (maskClosable) setOpen(false)
              }}
            />
            <Show when={() => Boolean(rect())}>
              {() => (
                <div
                  className={styles.highlight}
                  style={reactive((): CSSProperties => {
                    const box = rect()
                    if (!box) return {}
                    return {
                      top: box.top - 4,
                      left: box.left - 4,
                      width: box.width + 8,
                      height: box.height + 8,
                    }
                  })}
                />
              )}
            </Show>
            <div
              role="dialog"
              aria-modal="true"
              aria-label={
                typeof activeStep.title === 'string'
                  ? activeStep.title
                  : 'Product tour'
              }
              className={cx(styles.tooltip, className)}
              style={reactive(() => position() ?? {})}
            >
              <div className={styles.header}>
                <h3 className={styles.title}>{activeStep.title}</h3>
                <span className={styles.progress}>
                  {currentIndex + 1} / {total}
                </span>
              </div>
              {activeStep.description ? (
                <p className={styles.description}>{activeStep.description}</p>
              ) : null}
              {activeStep.image ? (
                <img
                  src={activeStep.image}
                  alt=""
                  className={styles.media}
                  loading="lazy"
                />
              ) : null}
              <div className={styles.footer}>
                <div>
                  {showSkip ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setOpen(false)}
                    >
                      Skip
                    </Button>
                  ) : null}
                </div>
                <div className={styles.actions}>
                  {activeStep.action ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={activeStep.action.onClick}
                    >
                      {activeStep.action.label}
                    </Button>
                  ) : null}
                  {currentIndex > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => go(currentIndex - 1)}
                    >
                      Back
                    </Button>
                  ) : null}
                  <Button
                    ref={(node: Element) => {
                      nextRef.current = node as HTMLButtonElement | null
                    }}
                    size="sm"
                    onClick={() => {
                      if (currentIndex >= total - 1) finish()
                      else go(currentIndex + 1)
                    }}
                  >
                    {currentIndex >= total - 1 ? 'Done' : 'Next'}
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Close tour"
                className={styles.close}
                onClick={() => setOpen(false)}
              >
                <X aria-hidden size={14} />
              </Button>
            </div>
          </Portal>
        )
      }}
    </Show>
  )
}
