import { effect, onCleanup, signal, type Accessor } from '@vorzelajs/core'
import { createContext, Show, useContext } from '@vorzelajs/dom'
import { useId } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { ChevronDown } from './icons.tsx'
import styles from './navigation-menu.module.scss'
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from '../../types.ts'

interface NavigationMenuContextValue {
  value: Accessor<string>
  setValue: (value: string) => void
  baseId: string
}

const NavigationMenuContext =
  createContext<NavigationMenuContextValue | null>(null, 'navigation-menu')
const NavigationMenuItemContext = createContext<string | null>(
  null,
  'navigation-menu-item',
)

function useNavigationMenu(component: string): NavigationMenuContextValue {
  const context = useContext(NavigationMenuContext)
  if (!context) {
    throw new Error(
      `<${component}> must be rendered inside <NavigationMenu>.`,
    )
  }
  return context
}

/**
 * Navigation menu root. Pass children as a function so items, triggers and
 * panels are created inside the shared context:
 * `<NavigationMenu>{() => <NavigationMenuList>…</NavigationMenuList>}</NavigationMenu>`.
 */
export interface NavigationMenuProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | (() => ReactNode)
}

export function NavigationMenu({
  className,
  children,
  ...props
}: NavigationMenuProps) {
  const [value, setValue] = signal('')
  const baseId = useId('navigation-menu')
  const [root, setRoot] = signal<HTMLElement | null>(null)

  const context: NavigationMenuContextValue = { value, setValue, baseId }

  effect(() => {
    if (!value() || typeof document === 'undefined') return

    const handlePointerDown = (event: globalThis.PointerEvent): void => {
      if (!root()?.contains(event.target as Node)) setValue('')
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      const trigger = root()?.querySelector<HTMLElement>(
        '[data-nav-item][data-state="open"] [data-nav-trigger]',
      )
      setValue('')
      trigger?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    })
  })

  return (
    <NavigationMenuContext.Provider value={context}>
      {() => {
        const content =
          typeof children === 'function'
            ? (children as () => ReactNode)()
            : children

        return (
          <nav
            {...props}
            ref={(node) => setRoot(node as HTMLElement)}
            data-navigation-menu
            className={cx(styles.root, className)}
          >
            {content}
          </nav>
        )
      }}
    </NavigationMenuContext.Provider>
  )
}

export interface NavigationMenuListProps extends HTMLAttributes<HTMLUListElement> {}

export function NavigationMenuList({
  className,
  children,
  ...props
}: NavigationMenuListProps) {
  return (
    <ul className={cx(styles.list, className)} {...props}>
      {children}
    </ul>
  )
}

export interface NavigationMenuItemProps
  extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
  value?: string
  className?: string
  onMouseEnter?: (event: MouseEvent<HTMLLIElement>) => void
  onMouseLeave?: (event: MouseEvent<HTMLLIElement>) => void
  children?: ReactNode | ((value: string) => ReactNode)
}

export function NavigationMenuItem({
  value,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: NavigationMenuItemProps) {
  const context = useNavigationMenu('NavigationMenuItem')
  const generatedValue = useId('navigation-menu-item')
  const itemValue = value ?? generatedValue
  const isOpen = (): boolean => context.value() === itemValue

  const renderChildren =
    typeof children === 'function'
      ? (children as (value: string) => ReactNode)
      : null

  const content: ReactNode = renderChildren ? (
    <NavigationMenuItemContext.Provider value={itemValue}>
      {() => renderChildren(itemValue)}
    </NavigationMenuItemContext.Provider>
  ) : (
    (children as ReactNode)
  )

  return (
    <li
      {...props}
      className={cx(styles.item, className)}
      data-nav-item
      data-value={itemValue}
      data-state={() => (isOpen() ? 'open' : 'closed')}
      onMouseEnter={(event) => {
        onMouseEnter?.(event as unknown as MouseEvent<HTMLLIElement>)
        if (!event.defaultPrevented) context.setValue(itemValue)
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event as unknown as MouseEvent<HTMLLIElement>)
        if (!event.defaultPrevented) context.setValue('')
      }}
    >
      {content}
    </li>
  )
}

export interface NavigationMenuTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value?: string
  __navValue?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function NavigationMenuTrigger({
  className,
  children,
  value,
  __navValue,
  onClick,
  onKeyDown,
  ...props
}: NavigationMenuTriggerProps) {
  const context = useNavigationMenu('NavigationMenuTrigger')
  const itemValue = useContext(NavigationMenuItemContext)
  const navValue = __navValue ?? value ?? itemValue ?? ''
  const isOpen = (): boolean =>
    Boolean(navValue) && context.value() === navValue

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ): void => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    if (event.key === 'Escape') {
      if (!isOpen()) return
      event.preventDefault()
      context.setValue('')
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen()) context.setValue(navValue)

      const item = event.currentTarget.closest('[data-nav-item]')
      requestAnimationFrame(() => {
        item
          ?.querySelector<HTMLElement>('[data-nav-content]')
          ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
          ?.focus()
      })
      return
    }

    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(event.key)) return

    const triggers = Array.from(
      event.currentTarget
        .closest('[data-navigation-menu]')
        ?.querySelectorAll<HTMLButtonElement>('[data-nav-trigger]') ?? [],
    )
    if (triggers.length === 0) return

    event.preventDefault()
    const current = triggers.indexOf(event.currentTarget)
    let next = current

    if (event.key === 'ArrowRight') next = (current + 1) % triggers.length
    if (event.key === 'ArrowLeft')
      next = (current - 1 + triggers.length) % triggers.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = triggers.length - 1

    const target = triggers[next]
    target?.focus()

    if (context.value()) {
      const targetValue = target
        ?.closest('[data-nav-item]')
        ?.getAttribute('data-value')
      context.setValue(targetValue ?? '')
    }
  }

  return (
    <button
      type="button"
      {...props}
      className={cx(styles.trigger, className)}
      data-nav-trigger
      aria-expanded={() => (isOpen() ? 'true' : 'false')}
      aria-controls={
        navValue ? `${context.baseId}-${navValue}-content` : undefined
      }
      data-state={() => (isOpen() ? 'open' : 'closed')}
      onClick={(event) => {
        onClick?.(event as unknown as MouseEvent<HTMLButtonElement>)
        if (event.defaultPrevented) return
        context.setValue(isOpen() ? '' : navValue)
      }}
      onKeyDown={
        handleKeyDown as unknown as (event: globalThis.KeyboardEvent) => void
      }
    >
      {children}
      <ChevronDown className={styles.chevron} aria-hidden />
    </button>
  )
}

export interface NavigationMenuContentProps
  extends HTMLAttributes<HTMLDivElement> {
  value?: string
  __navValue?: string
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
}

export function NavigationMenuContent({
  className,
  children,
  value,
  __navValue,
  onKeyDown,
  ...props
}: NavigationMenuContentProps) {
  const context = useNavigationMenu('NavigationMenuContent')
  const itemValue = useContext(NavigationMenuItemContext)
  const navValue = __navValue ?? value ?? itemValue ?? ''
  const isOpen = (): boolean =>
    Boolean(navValue) && context.value() === navValue

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    if (event.key === 'Escape') {
      event.preventDefault()
      context.setValue('')
      event.currentTarget
        .closest('[data-nav-item]')
        ?.querySelector<HTMLElement>('[data-nav-trigger]')
        ?.focus()
      return
    }

    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return

    const links = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      ),
    )
    if (links.length === 0) return

    event.preventDefault()
    const current = links.indexOf(event.target as HTMLElement)
    let next = current

    if (event.key === 'ArrowDown') next = (current + 1) % links.length
    if (event.key === 'ArrowUp')
      next = (current - 1 + links.length) % links.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = links.length - 1

    links[next]?.focus()
  }

  return (
    <Show when={isOpen}>
      {() => (
        <div
          {...props}
          id={navValue ? `${context.baseId}-${navValue}-content` : undefined}
          data-nav-content
          className={cx(styles.content, className)}
          onKeyDown={
            handleKeyDown as unknown as (
              event: globalThis.KeyboardEvent,
            ) => void
          }
        >
          <div className={styles.contentPanel}>{children}</div>
        </div>
      )}
    </Show>
  )
}

export interface NavigationMenuLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {}

export function NavigationMenuLink({
  className,
  children,
  ...props
}: NavigationMenuLinkProps) {
  return (
    <a {...props} className={cx(styles.link, className)}>
      {children}
    </a>
  )
}

export interface NavigationMenuViewportProps
  extends HTMLAttributes<HTMLDivElement> {}

export function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuViewportProps) {
  const { value } = useNavigationMenu('NavigationMenuViewport')

  return (
    <div
      {...props}
      className={cx(styles.viewport, className)}
      data-state={() => (value() ? 'open' : 'closed')}
    >
      <div className={styles.viewportInner} />
    </div>
  )
}

export interface NavigationMenuIndicatorProps
  extends HTMLAttributes<HTMLDivElement> {}

export function NavigationMenuIndicator({
  className,
  ...props
}: NavigationMenuIndicatorProps) {
  const { value } = useNavigationMenu('NavigationMenuIndicator')

  return (
    <div
      {...props}
      className={cx(styles.indicator, className)}
      data-state={() => (value() ? 'visible' : 'hidden')}
    >
      <div className={styles.indicatorArrow} />
    </div>
  )
}
