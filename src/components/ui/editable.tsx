import { effect, signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { accessorOf, useId } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Pencil } from './icons.tsx'
import styles from './editable.module.scss'

export interface EditableProps {
  value?: string | (() => string)
  defaultValue?: string
  onSave?: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  id?: string
}

/** Click-to-edit text. Enter saves, Escape cancels, blur saves. */
export function Editable({
  value: valueProp,
  defaultValue = '',
  onSave,
  label = 'Value',
  placeholder = 'Click to edit',
  className,
  id,
}: EditableProps) {
  const inputId = id ?? useId('editable')
  const [uncontrolled, setUncontrolled] = signal(defaultValue)
  const controlled =
    valueProp === undefined ? null : accessorOf<string>(valueProp)
  const value = (): string => (controlled ? controlled() : uncontrolled())

  const [editing, setEditing] = signal(false)
  const [draft, setDraft] = signal(value())
  const [input, setInput] = signal<HTMLInputElement | null>(null)

  effect(() => {
    const next = value()
    if (!editing()) setDraft(next)
  })

  // The input is created and inserted by Show after the edit state flips, so
  // focus lands in the microtask once the node is actually in the document.
  effect(() => {
    if (!editing()) return
    const node = input()
    if (!node || typeof queueMicrotask !== 'function') return

    queueMicrotask(() => {
      if (editing() && node.isConnected) node.focus()
    })
  })

  const commit = (): void => {
    const next = draft()
    if (next !== value()) {
      if (!controlled) setUncontrolled(next)
      onSave?.(next)
    }
    setEditing(false)
  }

  return (
    <div className={cx(styles.root, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <Show
        when={editing}
        fallback={() => (
          <button
            type="button"
            id={inputId}
            className={styles.trigger}
            onClick={() => setEditing(true)}
          >
            <span
              className={() =>
                cx(styles.value, !value() && styles.placeholder)
              }
            >
              {() => value() || placeholder}
            </span>
            <span className={styles.pencil}>
              <Pencil aria-hidden />
            </span>
          </button>
        )}
      >
        {() => (
          <input
            ref={(node) => setInput(node as HTMLInputElement)}
            id={inputId}
            className={styles.input}
            value={() => draft()}
            onChange={(event) =>
              setDraft((event.currentTarget as HTMLInputElement).value)
            }
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commit()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setDraft(value())
                setEditing(false)
              }
            }}
          />
        )}
      </Show>
    </div>
  )
}
