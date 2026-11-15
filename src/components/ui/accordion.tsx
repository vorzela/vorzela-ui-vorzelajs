import { signal } from '@vorzelajs/core'
import { For } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import { ChevronDown } from './icons.tsx'
import styles from './accordion.module.scss'

export type AccordionItem = {
  id: string
  title: string
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[] | (() => AccordionItem[])
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  onValueChange?: (value: string[]) => void
  className?: string
}

/** A list of disclosure sections. Single mode keeps one panel open at a time. */
export function Accordion({
  items,
  type = 'single',
  defaultValue,
  onValueChange,
  className,
}: AccordionProps) {
  const baseId = useId('accordion')
  const [open, setOpen] = signal<string[]>(
    !defaultValue
      ? []
      : Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue],
  )

  const toggle = (id: string): void => {
    const current = open()
    const isOpen = current.includes(id)
    const next =
      type === 'single'
        ? isOpen
          ? []
          : [id]
        : isOpen
          ? current.filter((value) => value !== id)
          : [...current, id]

    setOpen(next)
    onValueChange?.(next)
  }

  const handleKeyDown = (event: KeyboardEvent): void => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return

    const root = event.currentTarget as HTMLDivElement
    const triggers = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]'),
    )
    if (triggers.length === 0) return

    const current = triggers.indexOf(event.target as HTMLButtonElement)
    if (current === -1) return

    event.preventDefault()

    let next = current
    if (event.key === 'ArrowDown') next = (current + 1) % triggers.length
    if (event.key === 'ArrowUp')
      next = (current - 1 + triggers.length) % triggers.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = triggers.length - 1

    triggers[next]?.focus()
  }

  return (
    <div
      className={cx(styles.root, className)}
      onKeyDown={handleKeyDown}
      data-type={type}
    >
      <For each={accessorOf<AccordionItem[]>(items)} key={(item) => item.id}>
        {(item) => {
          const triggerId = `${baseId}-${item.id}-trigger`
          const panelId = `${baseId}-${item.id}-panel`
          const isOpen = (): boolean => open().includes(item.id)

          return (
            <div
              className={styles.item}
              data-state={() => (isOpen() ? 'open' : 'closed')}
            >
              <h3 className={styles.heading}>
                <button
                  type="button"
                  id={triggerId}
                  className={styles.trigger}
                  aria-expanded={() => String(isOpen())}
                  aria-controls={panelId}
                  data-accordion-trigger
                  onClick={() => toggle(item.id)}
                >
                  <span className={styles.title}>{item.title}</span>
                  <ChevronDown className={styles.chevron} aria-hidden="true" />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                inert={() => (!isOpen() ? true : undefined)}
                className={styles.panel}
              >
                <div className={styles.panelInner}>
                  <div className={styles.content}>{item.content}</div>
                </div>
              </div>
            </div>
          )
        }}
      </For>
    </div>
  )
}
