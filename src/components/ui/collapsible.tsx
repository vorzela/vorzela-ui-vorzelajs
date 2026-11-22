import { signal, type Accessor } from '@vorzelajs/core'
import { createContext, useContext } from '@vorzelajs/dom'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import { ChevronDown } from './icons.tsx'
import styles from './collapsible.module.scss'

interface CollapsibleContextValue {
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
  contentId: string
  triggerId: string
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(
  null,
  'collapsible',
)

function useCollapsible(component: string): CollapsibleContextValue {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Collapsible>.`)
  }
  return context
}

export interface CollapsibleProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children?: ReactNode
}

/**
 * Controlled or uncontrolled disclosure with a smooth height transition.
 *
 * Vorzela evaluates JSX eagerly, so pass the compound parts as a function
 * child: `<Collapsible>{() => <CollapsibleTrigger />}</Collapsible>`.
 */
export function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
}: CollapsibleProps) {
  const [uncontrolled, setUncontrolled] = signal(defaultOpen)
  const open = (): boolean =>
    controlledOpen !== undefined ? controlledOpen : uncontrolled()

  const setOpen = (next: boolean): void => {
    if (controlledOpen === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }

  const contentId = useId('collapsible-content')
  const triggerId = useId('collapsible-trigger')

  const value: CollapsibleContextValue = {
    open,
    setOpen,
    contentId,
    triggerId,
  }

  return (
    <CollapsibleContext.Provider value={value}>
      {() => (
        <div
          className={cx(styles.root, className)}
          data-state={() => (open() ? 'open' : 'closed')}
        >
          {typeof children === 'function'
            ? (children as () => ReactNode)()
            : children}
        </div>
      )}
    </CollapsibleContext.Provider>
  )
}

export interface CollapsibleTriggerProps {
  className?: string
  children?: ReactNode
}

export function CollapsibleTrigger({
  className,
  children,
}: CollapsibleTriggerProps) {
  const { open, setOpen, contentId, triggerId } =
    useCollapsible('CollapsibleTrigger')

  return (
    <button
      type="button"
      id={triggerId}
      className={cx(styles.trigger, className)}
      aria-expanded={() => String(open())}
      aria-controls={contentId}
      onClick={() => setOpen(!open())}
    >
      <span className={styles.triggerLabel}>{children}</span>
      <ChevronDown className={styles.chevron} aria-hidden="true" />
    </button>
  )
}

export interface CollapsibleContentProps {
  className?: string
  children?: ReactNode
}

export function CollapsibleContent({
  className,
  children,
}: CollapsibleContentProps) {
  const { open, contentId, triggerId } =
    useCollapsible('CollapsibleContent')

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      className={cx(styles.content, className)}
      data-state={() => (open() ? 'open' : 'closed')}
      inert={() => (!open() ? true : undefined)}
    >
      <div className={styles.contentInner}>
        <div className={styles.contentBody}>{children}</div>
      </div>
    </div>
  )
}
