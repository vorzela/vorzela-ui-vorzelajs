import { effect, signal } from '@vorzelajs/core'

import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { forwardRef } from '../../types.ts'
import type { HTMLAttributes, ReactNode } from '../../types.ts'
import { Toggle } from './toggle.tsx'
import type { ToggleSize, ToggleVariant } from './toggle.tsx'
import toggleStyles from './toggle.module.scss'
import styles from './toggle-group.module.scss'

const VARIANT_CLASS: Record<ToggleVariant, string> = {
  default: '',
  outline: toggleStyles.outline,
}

const SIZE_CLASS: Record<ToggleSize, string> = {
  default: '',
  sm: toggleStyles.sm,
  lg: toggleStyles.lg,
}

const ITEM_SELECTOR = '[data-toggle-group-item]'

interface SyncElement {
  attributes?: Map<string, string>
  getAttribute?: (name: string) => string | null
  setAttribute?: (name: string, value: string) => void
  classList?: {
    add: (...tokens: string[]) => void
    remove: (...tokens: string[]) => void
  }
  children?: ArrayLike<SyncElement>
  childNodes?: ArrayLike<SyncElement>
}

function attribute(element: SyncElement, name: string): string | null {
  if (typeof element.getAttribute === 'function') {
    return element.getAttribute(name)
  }
  return element.attributes?.get(name) ?? null
}

function setAttribute(element: SyncElement, name: string, value: string): void {
  if (typeof element.setAttribute === 'function') {
    element.setAttribute(name, value)
  } else {
    element.attributes?.set(name, value)
  }
}

function updateClasses(
  element: SyncElement,
  removed: string[],
  added: string[],
): void {
  const remove = removed.filter(Boolean)
  const add = added.filter(Boolean)
  if (!remove.length && !add.length) return

  if (element.classList) {
    if (remove.length) element.classList.remove(...remove)
    if (add.length) element.classList.add(...add)
    return
  }

  // Server nodes expose a plain class attribute instead of a DOMTokenList.
  const classes = (element.attributes?.get('class') ?? '')
    .split(/\s+/)
    .filter((entry) => entry && !remove.includes(entry))

  for (const entry of add) {
    if (!classes.includes(entry)) classes.push(entry)
  }

  element.attributes?.set('class', classes.join(' '))
}

/** Works for DOM elements and the server renderer's small node tree. */
function collectItems(element: SyncElement, out: SyncElement[]): void {
  const children = element.children ?? element.childNodes
  if (!children) return

  for (const child of Array.from(children)) {
    if (attribute(child, 'data-toggle-group-item') !== null) out.push(child)
    collectItems(child, out)
  }
}

function isPressed(
  value: string | string[],
  itemValue: string,
  type: 'single' | 'multiple',
): boolean {
  return type === 'single'
    ? value === itemValue
    : Array.isArray(value) && value.includes(itemValue)
}

/**
 * State lives on the group, not in each item, because Vorzela evaluates JSX
 * children eagerly — a context provider cannot reach items that were created
 * before the group ran. The group therefore owns `aria-pressed`/`data-state`
 * for its item nodes.
 */
function syncItems(
  root: HTMLElement,
  value: string | string[],
  type: 'single' | 'multiple',
  variant?: ToggleVariant,
  size?: ToggleSize,
): void {
  const items: SyncElement[] = []
  collectItems(root as unknown as SyncElement, items)

  for (const item of items) {
    const itemValue = attribute(item, 'data-toggle-value') ?? ''
    const pressed = isPressed(value, itemValue, type)

    setAttribute(item, 'aria-pressed', pressed ? 'true' : 'false')
    setAttribute(item, 'data-state', pressed ? 'on' : 'off')

    if (variant !== undefined) {
      updateClasses(
        item,
        [toggleStyles.outline],
        [VARIANT_CLASS[variant]],
      )
    }

    if (size !== undefined) {
      updateClasses(
        item,
        [toggleStyles.sm, toggleStyles.lg],
        [SIZE_CLASS[size]],
      )
    }
  }
}

export type ToggleGroupProps = HTMLAttributes<HTMLDivElement> & {
  type?: 'single' | 'multiple'
  value?: string | string[] | (() => string | string[])
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  variant?: ToggleVariant
  size?: ToggleSize
  children?: ReactNode
}

export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup(
    {
      className,
      variant,
      size,
      children,
      type = 'single',
      value: valueProp,
      defaultValue,
      onValueChange,
      ...props
    },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = signal<string | string[]>(
      defaultValue ?? (type === 'single' ? '' : []),
    )
    const controlled =
      valueProp === undefined
        ? null
        : accessorOf<string | string[]>(valueProp)
    const value = (): string | string[] =>
      controlled ? controlled() : uncontrolled()

    let root: HTMLDivElement | null = null

    const handleClick = (event: globalThis.MouseEvent): void => {
      const target = event.target as Element | null
      const item = target?.closest?.(ITEM_SELECTOR) as HTMLElement | null
      if (!item || !root?.contains(item)) return
      // Nested groups: only the closest group owns the click.
      if (item.closest('[data-toggle-group]') !== root) return

      const itemValue = item.getAttribute('data-toggle-value') ?? ''
      const current = value()
      let next: string | string[]

      if (type === 'single') {
        next = current === itemValue ? '' : itemValue
      } else {
        const list = Array.isArray(current) ? current : []
        next = list.includes(itemValue)
          ? list.filter((entry) => entry !== itemValue)
          : [...list, itemValue]
      }

      if (!controlled) setUncontrolled(next)
      onValueChange?.(next)
      if (root) syncItems(root, next, type, variant, size)
    }

    const node = (
      <div
        {...props}
        ref={(element) => {
          root = element as HTMLDivElement
          if (ref) {
            if (typeof ref === 'function') ref(element)
            else ref.current = element
          }
        }}
        role="group"
        data-toggle-group=""
        data-toggle-type={type}
        className={cx(styles.root, className)}
        onClick={handleClick}
      >
        {children}
      </div>
    ) as HTMLDivElement

    root = node
    // Synchronous pass so SSR and the first paint already expose the
    // selection; the effect below keeps it in sync with a signal-backed value.
    syncItems(node, value(), type, variant, size)
    effect(() => {
      syncItems(node, value(), type, variant, size)
    })

    return node
  },
)

ToggleGroup.displayName = 'ToggleGroup'

export type ToggleGroupItemProps = HTMLAttributes<HTMLButtonElement> & {
  value: string
  pressed?: boolean | (() => boolean)
  onPressedChange?: (pressed: boolean) => void
  variant?: ToggleVariant
  size?: ToggleSize
  onClick?: (event: globalThis.MouseEvent) => void
}

export const ToggleGroupItem = forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(function ToggleGroupItem(
  { className, children, variant, size, onClick, ...props },
  ref,
) {
  return (
    <Toggle
      {...props}
      ref={ref}
      className={cx(styles.item, className)}
      variant={variant}
      size={size}
      data-toggle-value={props.value}
      data-toggle-group-item=""
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return

        // Inside a group the group owns selection. Stopping Toggle's own
        // toggle keeps the item from fighting the group's authoritative state.
        const target = event.currentTarget as HTMLElement
        if (target.closest('[data-toggle-group]')) event.preventDefault()
      }}
    >
      {children}
    </Toggle>
  )
})

ToggleGroupItem.displayName = 'ToggleGroupItem'
