/**
 * components/ui/dropdown.tsx
 *
 * Viewport-aware dropdown menu.
 */
import { effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import styles from './dropdown.module.scss'

const VIEWPORT_MARGIN = 8

export interface DropdownItem {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  divider?: boolean
  onSelect?: () => void
}

interface PanelPos {
  top: number
  left: number
  minW: number
}

function computePosition(
  triggerEl: HTMLElement,
  panelWidth: number,
  panelHeight: number,
  alignPref: 'left' | 'right',
): PanelPos {
  const rect = triggerEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = VIEWPORT_MARGIN
  const gap = 4

  const spaceBelow = vh - rect.bottom - margin
  const spaceAbove = rect.top - margin
  const openUpward =
    spaceBelow < panelHeight + gap && spaceAbove > spaceBelow

  const idealLeft =
    alignPref === 'right' ? rect.right - panelWidth : rect.left
  const left = Math.max(
    margin,
    Math.min(idealLeft, vw - panelWidth - margin),
  )
  const idealTop = openUpward
    ? rect.top - panelHeight - gap
    : rect.bottom + gap
  const top = Math.max(
    margin,
    Math.min(idealTop, vh - panelHeight - margin),
  )

  return { top, left, minW: Math.max(rect.width, 160) }
}

export interface DropdownProps {
  trigger: ReactNode
  items?: DropdownItem[] | (() => DropdownItem[])
  children?: ReactNode
  width?: string | number
  closeOnSelect?: boolean
  open?: boolean | (() => boolean)
  onOpenChange?: (open: boolean) => void
  className?: string
  align?: 'left' | 'right'
}

export function Dropdown({
  trigger,
  items,
  children,
  width,
  closeOnSelect = true,
  open,
  onOpenChange,
  className,
  align = 'left',
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = signal(false)
  const controlledOpen = open === undefined ? null : accessorOf(open)
  const isOpen = (): boolean =>
    controlledOpen ? controlledOpen() : internalOpen()

  const setOpen = (value: boolean): void => {
    if (!controlledOpen) setInternalOpen(value)
    onOpenChange?.(value)
  }

  const [triggerNode, setTriggerNode] = signal<HTMLDivElement | null>(null)
  const [panelNode, setPanelNode] = signal<HTMLDivElement | null>(null)
  const [pos, setPos] = signal<PanelPos>({ top: 0, left: 0, minW: 160 })
  const [posReady, setPosReady] = signal(false)

  onCleanup(() => setTriggerNode(null))

  const fallbackWidth = (): number =>
    typeof width === 'number' ? width : 200

  // Measure only after the portal panel is attached; a detached node has zero
  // offsetWidth and would place the menu at the viewport origin.
  effect(() => {
    const openNow = isOpen()
    const trigger = triggerNode()
    const panel = panelNode()

    if (!openNow) {
      setPosReady(false)
      return
    }

    if (!trigger || !panel || typeof window === 'undefined') return

    const frame = requestAnimationFrame(() => {
      setPos(
        computePosition(
          trigger,
          panel.offsetWidth || fallbackWidth(),
          panel.offsetHeight || 280,
          align,
        ),
      )
      setPosReady(true)
    })
    onCleanup(() => cancelAnimationFrame(frame))
  })

  effect(() => {
    if (!isOpen() || typeof window === 'undefined') return

    const handler = (): void => {
      const trigger = triggerNode()
      if (!trigger) return
      const panel = panelNode()
      setPos(
        computePosition(
          trigger,
          panel?.offsetWidth || fallbackWidth(),
          panel?.offsetHeight || 280,
          align,
        ),
      )
    }

    window.addEventListener('scroll', handler, { passive: true, capture: true })
    window.addEventListener('resize', handler, { passive: true })
    onCleanup(() => {
      window.removeEventListener('scroll', handler, { capture: true })
      window.removeEventListener('resize', handler)
    })
  })

  effect(() => {
    if (!isOpen() || typeof document === 'undefined') return

    const handler = (event: MouseEvent): void => {
      const target = event.target as Node
      if (triggerNode()?.contains(target) || panelNode()?.contains(target)) {
        return
      }
      setOpen(false)
    }

    const id = setTimeout(
      () => document.addEventListener('mousedown', handler),
      0,
    )
    onCleanup(() => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handler)
    })
  })

  effect(() => {
    if (!isOpen() || typeof document === 'undefined') return

    const handler = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
      triggerNode()
        ?.querySelector<HTMLElement>('button, a, [tabindex]')
        ?.focus()
    }

    document.addEventListener('keydown', handler)
    onCleanup(() => document.removeEventListener('keydown', handler))
  })

  const handleItemClick = (item: DropdownItem): void => {
    if (item.disabled) return
    item.onSelect?.()
    if (closeOnSelect) setOpen(false)
  }

  return (
    <>
      <div
        ref={(element) => setTriggerNode(element as HTMLDivElement)}
        className={styles.trigger}
        onClick={() => setOpen(!isOpen())}
      >
        {trigger}
      </div>

      <Show when={isOpen}>
        {() => {
          const panel = (
            <Portal>
              <div
                ref={(element) => setPanelNode(element as HTMLDivElement)}
                role="menu"
                aria-orientation="vertical"
                style={() => ({
                  position: 'fixed',
                  top: `${pos().top}px`,
                  left: `${pos().left}px`,
                  minWidth: `${pos().minW}px`,
                  visibility: posReady() ? 'visible' : 'hidden',
                  ...(width !== undefined
                    ? {
                        width:
                          typeof width === 'number' ? `${width}px` : width,
                      }
                    : {}),
                })}
                className={cx(styles.panel, className)}
              >
                {items ? (
                  <For
                    each={accessorOf<DropdownItem[]>(items)}
                    key={(item) => item.key}
                  >
                    {(item) => [
                      item.divider ? (
                        <div className={styles.divider} role="separator" />
                      ) : null,
                      <DropdownRow
                        item={item}
                        onClick={() => handleItemClick(item)}
                      />,
                    ]}
                  </For>
                ) : (
                  children
                )}
              </div>
            </Portal>
          )

          onCleanup(() => setPanelNode(null))
          return panel
        }}
      </Show>
    </>
  )
}

function DropdownRow({
  item,
  onClick,
}: {
  item: DropdownItem
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      className={cx(styles.item, item.danger && styles.itemDanger)}
      onClick={onClick}
    >
      {item.icon ? <span className={styles.itemIcon}>{item.icon}</span> : null}
      {item.label}
    </button>
  )
}

export interface DropdownMenuItemProps {
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  divider?: boolean
  onClick?: () => void
  children?: ReactNode
  className?: string
}

export function DropdownMenuItem({
  icon,
  danger,
  disabled,
  divider,
  onClick,
  children,
  className,
}: DropdownMenuItemProps) {
  return (
    <>
      {divider ? (
        <div className={styles.divider} role="separator" />
      ) : null}

      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        className={cx(styles.item, danger && styles.itemDanger, className)}
        onClick={onClick}
      >
        {icon ? (
          <span className={styles.itemIcon}>{icon}</span>
        ) : (
          <span className={cx(styles.itemIcon, styles.itemIconEmpty)} />
        )}
        {children}
      </button>
    </>
  )
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <p className={styles.label}>{children}</p>
}
