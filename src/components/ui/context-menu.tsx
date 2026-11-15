/**
 * components/ui/context-menu.tsx
 *
 * Context menu triggered by right-click (or the Menu key / Shift+F10).
 */
import { effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import styles from './context-menu.module.scss'

export interface ContextMenuItem {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  divider?: boolean
  onSelect?: () => void
}

export interface ContextMenuProps {
  items?: ContextMenuItem[] | (() => ContextMenuItem[])
  children?: ReactNode
  className?: string
}

export function ContextMenu({ items, children, className }: ContextMenuProps) {
  const [open, setOpen] = signal(false)
  const [pos, setPos] = signal({ x: 0, y: 0 })
  const contentId = useId('context-menu')
  const [panelNode, setPanelNode] = signal<HTMLDivElement | null>(null)

  effect(() => {
    if (!open() || typeof document === 'undefined') return

    const handler = (event: PointerEvent): void => {
      const target = event.target as Node
      if (panelNode()?.contains(target)) return
      setOpen(false)
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
    if (!open() || typeof document === 'undefined') return

    const handler = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
    }

    document.addEventListener('keydown', handler, { capture: true })
    onCleanup(() =>
      document.removeEventListener('keydown', handler, { capture: true }),
    )
  })

  // Clamp the portal panel to the viewport once its real size is known, then
  // move keyboard focus into the menu.
  effect(() => {
    const isOpen = open()
    const panel = panelNode()
    if (!isOpen || !panel || typeof window === 'undefined') return

    const frame = requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect()
      const maxX = window.innerWidth - rect.width - 8
      const maxY = window.innerHeight - rect.height - 8

      setPos((current) => {
        const x = Math.max(8, Math.min(current.x, maxX))
        const y = Math.max(8, Math.min(current.y, maxY))
        return x === current.x && y === current.y ? current : { x, y }
      })

      panel
        .querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')
        ?.focus()
    })
    onCleanup(() => cancelAnimationFrame(frame))
  })

  const handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = 200
    const height = 240

    setPos({
      x: Math.min(event.clientX, vw - width - 8),
      y: Math.min(event.clientY, vh - height - 8),
    })
    setOpen(true)
  }

  return (
    <>
      <div
        className={cx(styles.root, className)}
        onContextMenu={handleContextMenu}
        onKeyDown={(event: KeyboardEvent) => {
          if (
            event.key !== 'ContextMenu' &&
            !(event.shiftKey && event.key === 'F10')
          ) {
            return
          }
          event.preventDefault()
          const rect = (
            event.currentTarget as HTMLElement
          ).getBoundingClientRect()
          setPos({ x: rect.left + 8, y: rect.top + 8 })
          setOpen(true)
        }}
      >
        {children}
      </div>

      <Show when={open}>
        {() => {
          const panel = (
            <Portal>
              <div
                ref={(element) => setPanelNode(element as HTMLDivElement)}
                id={contentId}
                role="menu"
                aria-label="Context menu"
                style={() => ({
                  top: `${pos().y}px`,
                  left: `${pos().x}px`,
                })}
                className={styles.panel}
              >
                <For
                  each={accessorOf<ContextMenuItem[]>(items ?? [])}
                  key={(item) => item.key}
                >
                  {(item) => [
                    item.divider ? (
                      <div className={styles.divider} role="separator" />
                    ) : null,

                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      className={cx(
                        styles.item,
                        item.danger && styles.itemDanger,
                      )}
                      onClick={() => {
                        if (item.disabled) return
                        item.onSelect?.()
                        setOpen(false)
                      }}
                    >
                      {item.icon ? (
                        <span className={styles.itemIcon}>{item.icon}</span>
                      ) : (
                        <span
                          className={cx(
                            styles.itemIcon,
                            styles.itemIconEmpty,
                          )}
                        />
                      )}
                      {item.label}
                    </button>,
                  ]}
                </For>
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

export interface ContextMenuTriggerProps {
  children: ReactNode
}

export function ContextMenuTrigger({ children }: ContextMenuTriggerProps) {
  return <>{children}</>
}
