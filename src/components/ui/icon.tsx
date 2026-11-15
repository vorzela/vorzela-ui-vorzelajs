import { jsx, type Component, type Renderable } from '@vorzelajs/dom'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import styles from './icon.module.scss'

export type IconNode = [tag: string, attrs: Record<string, string | number | undefined>][]

export interface IconProps {
  /** Lucide icon node. Omit when composing with children. */
  node?: IconNode
  children?: ReactNode
  label?: string
  size?: number | string | 'sm' | 'md' | 'lg'
  strokeWidth?: number
  class?: string
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
  'aria-label'?: string
  [key: string]: unknown
}

export interface IconComponent extends Component<IconProps> {
  readonly iconNode?: IconNode
}

/**
 * Renders a Lucide icon node as an inline SVG. Icons inherit `currentColor`
 * and are decorative by default.
 */
export function Icon(props: IconProps): Renderable {
  const {
    node,
    children,
    label,
    size = 24,
    strokeWidth = 2,
    class: className,
    className: camelClassName,
    'aria-hidden': ariaHidden,
    ...rest
  } = props

  if (!node) {
    const boxSize =
      size === 'sm' || size === 'md' || size === 'lg' ? size : 'md'
    return jsx('span', {
      class: cx(styles.root, styles[boxSize], camelClassName ?? className),
      role: label ? 'img' : undefined,
      'aria-label': label,
      'aria-hidden': label ? undefined : (ariaHidden ?? true),
      ...rest,
      children,
    }) as Renderable
  }

  return jsx('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': ariaHidden ?? true,
    class: camelClassName ?? className,
    ...rest,
    children: node.map(([tag, attrs]) => jsx(tag, attrs)),
  }) as Renderable
}

/** Builds a named icon component from a Lucide icon node. */
export function createIcon(node: IconNode): IconComponent {
  const component = ((props: IconProps) => Icon({ ...props, node })) as IconComponent
  Object.defineProperty(component, 'iconNode', { value: node })
  return component
}

export type LucideIcon = IconComponent
