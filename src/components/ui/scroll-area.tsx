import { cx } from '../../lib/cx.ts'
import type { CSSProperties, HTMLAttributes, ReactNode } from '../../types.ts'
import styles from './scroll-area.module.scss'

export type ScrollAxis = 'x' | 'y' | 'both'

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Maximum height before the area starts scrolling. Accepts any CSS length.
   * Ignored when `height` is set.
   */
  maxHeight?: string
  /** Fixed height. Takes precedence over `maxHeight`. */
  height?: string
  /** Maximum width before horizontal scroll kicks in. */
  maxWidth?: string
  /** Fixed width. Takes precedence over `maxWidth`. */
  width?: string
  /** Which axis/axes to scroll on. Defaults to `y`. */
  axis?: ScrollAxis
  /** Mask the leading and trailing edges so hidden content is discoverable. */
  fade?: boolean
  /** Accessible name for the scroll region. */
  'aria-label'?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

const AXIS_CLASS: Record<ScrollAxis, string> = {
  y: styles.axisY,
  x: styles.axisX,
  both: styles.axisBoth,
}

const FADE_LEADING = 'rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 24px'
const FADE_TRAILING =
  'rgba(0, 0, 0, 1) calc(100% - 24px), rgba(0, 0, 0, 0) 100%'

function fadeMask(axis: ScrollAxis): string {
  if (axis === 'x') {
    return `linear-gradient(to right, ${FADE_LEADING}, ${FADE_TRAILING})`
  }

  if (axis === 'y') {
    return `linear-gradient(to bottom, ${FADE_LEADING}, ${FADE_TRAILING})`
  }

  return [
    `linear-gradient(to right, ${FADE_LEADING}, ${FADE_TRAILING})`,
    `linear-gradient(to bottom, ${FADE_LEADING}, ${FADE_TRAILING})`,
  ].join(', ')
}

/** Isolated overflow container with a themed scrollbar and optional edge fade. */
export function ScrollArea({
  maxHeight,
  height,
  maxWidth,
  width,
  axis = 'y',
  fade,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: ScrollAreaProps) {
  const next: CSSProperties = {}

  if (height) next.height = height
  else if (maxHeight) next.maxHeight = maxHeight

  if (width) next.width = width
  else if (maxWidth) next.maxWidth = maxWidth

  if (fade) {
    const mask = fadeMask(axis)
    next.maskImage = mask
    next.WebkitMaskImage = mask
  }

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className={cx(styles.root, AXIS_CLASS[axis], className)}
      style={{ ...next, ...style }}
    >
      {children}
    </div>
  )
}
