import { createContext, useContext } from '@vorzelajs/dom'
import { cx } from '../../lib/cx.ts'
import styles from './timeline.module.scss'
import type { HTMLAttributes, ReactNode } from '../../types.ts'

export type TimelineStatus = 'default' | 'active' | 'done' | 'muted'
/** Colour of the default dot. Add your own if you fork the file. */
export type TimelineTone = 'neutral' | 'active' | 'success' | 'danger' | 'muted'
export type TimelineOrientation = 'vertical' | 'horizontal'

type ConnectorContext = {
  status: string
  orientation: TimelineOrientation
}

const LEGACY_TONE: Record<TimelineStatus, TimelineTone> = {
  default: 'neutral',
  active: 'active',
  done: 'success',
  muted: 'muted',
}

const TONE: Record<TimelineTone, string> = {
  neutral: styles.toneNeutral,
  active: styles.toneActive,
  success: styles.toneSuccess,
  danger: styles.toneDanger,
  muted: styles.toneMuted,
}

type TimelineContextValue = {
  orientation: TimelineOrientation
  align: 'start' | 'end'
  connector?: (context: ConnectorContext) => ReactNode
  pulse: boolean
  rail: boolean
}

const TimelineContext = createContext<TimelineContextValue>({
  orientation: 'vertical',
  align: 'start',
  pulse: false,
  rail: true,
})

/**
 * Timelines: pass children as a function so `TimelineItem` descendants run
 * inside the timeline context, e.g.
 * `<Timeline>{() => <TimelineItem>…</TimelineItem>}</Timeline>`.
 */
export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  /** Vertical list (default) or one column per step on a horizontal rail. */
  orientation?: TimelineOrientation
  /** Vertical only: put the rail on the end side. */
  align?: 'start' | 'end'
  /** Replace the connector segment drawn between nodes. */
  connector?: (context: ConnectorContext) => ReactNode
  /** Sweep a light pulse along the default connector. */
  pulse?: boolean
  /**
   * Render the rail column with its nodes and connectors (default). Pass
   * `false` to place nodes yourself — e.g. on the corners of a custom path.
   */
  rail?: boolean
  /**
   * Layer painted behind the items. Return an `<svg>` here to draw a custom
   * path (rope, snake, curve) instead of straight connectors — pair it with
   * `connector={() => null}`. The layer already covers the timeline box.
   */
  path?: ReactNode
  children?: ReactNode | (() => ReactNode)
}

export function Timeline({
  className,
  orientation = 'vertical',
  align = 'start',
  connector,
  pulse = false,
  rail = true,
  path,
  children,
  ...props
}: TimelineProps) {
  const context: TimelineContextValue = {
    orientation,
    align,
    connector,
    pulse,
    rail,
  }

  return (
    <TimelineContext.Provider value={context}>
      {() => {
        const content =
          typeof children === 'function'
            ? (children as () => ReactNode)()
            : children

        return (
          <ol
            data-orientation={orientation}
            data-align={align}
            className={cx(
              styles.root,
              orientation === 'vertical'
                ? styles.rootVertical
                : styles.rootHorizontal,
              className,
            )}
            {...props}
          >
            {path ? (
              <li aria-hidden className={styles.path}>
                {path}
              </li>
            ) : null}
            {content}
          </ol>
        )
      }}
    </TimelineContext.Provider>
  )
}

export interface TimelineItemProps extends HTMLAttributes<HTMLLIElement> {
  /**
   * Any string — `default`/`active`/`done`/`muted` are built in, anything
   * else (e.g. `shipped`) is exposed as `data-status` for your own styles.
   */
  status?: TimelineStatus | (string & {})
  /** Dot colour. Defaults from the legacy status names, else `neutral`. */
  tone?: TimelineTone
  /**
   * Compact marker rendered in the rail instead of a dot — a date, a step
   * number, anything. The rail widens to fit.
   */
  date?: ReactNode
  /** Machine-readable value for the `date` marker (`<time dateTime>`). */
  dateTime?: string
  /**
   * Replaces the marker entirely — an icon, avatar image, initials, or any
   * custom status component.
   */
  indicator?: ReactNode
  /** Extra classes for the node wrapper (position it when `rail={false}`). */
  indicatorClassName?: string
}

export function TimelineItem({
  className,
  status = 'default',
  tone,
  date,
  dateTime,
  indicator,
  indicatorClassName,
  children,
  ...props
}: TimelineItemProps) {
  const { orientation, align, connector, pulse, rail } =
    useContext(TimelineContext)
  const resolvedTone =
    tone ?? LEGACY_TONE[status as TimelineStatus] ?? 'neutral'
  const toneClass = TONE[resolvedTone]
  const custom = indicator !== undefined || date !== undefined

  const renderMarker = (): ReactNode =>
    indicator ??
    (date !== undefined ? (
      <time datetime={dateTime} className={styles.marker}>
        {date}
      </time>
    ) : undefined)

  const renderNode = (): ReactNode => (
    <span
      data-status={status}
      className={cx(
        styles.node,
        !custom && styles.dot,
        toneClass,
        resolvedTone === 'muted' && styles.muted,
        indicatorClassName,
      )}
    >
      {renderMarker()}
    </span>
  )

  const renderSegment = (extra: string): ReactNode => (
    <span aria-hidden className={cx(styles.segment, extra)}>
      {connector ? (
        connector({ status, orientation })
      ) : (
        <span
          className={cx(
            styles.line,
            orientation === 'vertical'
              ? styles.lineVertical
              : styles.lineHorizontal,
            pulse &&
              (orientation === 'horizontal'
                ? styles.pulseHorizontal
                : styles.pulseVertical),
          )}
        />
      )}
    </span>
  )

  if (orientation === 'horizontal') {
    return (
      <li
        data-status={status}
        className={cx(styles.item, styles.itemHorizontal, className)}
        {...props}
      >
        <div className={styles.horizontalHead}>
          {renderNode()}
          {renderSegment(styles.segmentHorizontal)}
        </div>
        <div className={styles.horizontalContent}>{children}</div>
      </li>
    )
  }

  if (!rail) {
    return (
      <li
        data-status={status}
        className={cx(styles.item, styles.itemNoRail, className)}
        {...props}
      >
        {custom ? (
          <span
            data-status={status}
            className={cx(
              styles.freeNode,
              toneClass,
              resolvedTone === 'muted' && styles.muted,
              indicatorClassName,
            )}
          >
            {renderMarker()}
          </span>
        ) : null}
        {children}
      </li>
    )
  }

  return (
    <li
      data-status={status}
      className={cx(
        styles.item,
        styles.itemRail,
        align === 'end' ? styles.railEnd : styles.railStart,
        className,
      )}
      {...props}
    >
      <div
        className={cx(
          styles.railColumn,
          align === 'end' && styles.railColumnEnd,
        )}
      >
        {renderSegment(styles.segmentVertical)}
        {/* Height matches the first line box, so any node size centres on it. */}
        <span className={styles.nodeRow}>{renderNode()}</span>
      </div>
      <div className={styles.railContent}>{children}</div>
    </li>
  )
}

export function TimelineTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx(styles.title, className)} {...props} />
}

export function TimelineDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx(styles.description, className)} {...props} />
}

export function TimelineTime({
  className,
  ...props
}: HTMLAttributes<HTMLTimeElement>) {
  return <time className={cx(styles.time, className)} {...props} />
}
