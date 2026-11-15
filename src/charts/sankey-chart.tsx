import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyGraph,
} from 'd3-sankey'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { chartColor, compactNumber } from './chart-utils.ts'
import type { ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'

export type SankeyNode = { id: string; name: string }
export type SankeyLink = { source: string; target: string; value: number }

type LayoutNode = SankeyNode & {
  x0?: number
  x1?: number
  y0?: number
  y1?: number
}
type LayoutLink = SankeyLink & {
  width?: number
  source: LayoutNode
  target: LayoutNode
}

function SankeyCanvas({
  nodes,
  links,
  size,
  animate,
  valueFormat,
}: {
  nodes: SankeyNode[]
  links: SankeyLink[]
  size: ChartSize
  animate: boolean
  valueFormat: (value: number) => string
}) {
  const [active, setActive] = signal<LayoutLink | null>(null)
  const progress = useAnimatedProgress({
    enabled: animate,
    resetKey: `${nodes.length}:${links.length}`,
  })

  const graph: SankeyGraph<LayoutNode, LayoutLink> = (() => {
    const clonedNodes = nodes.map((node) => ({ ...node })) as LayoutNode[]
    const byId = new Map(clonedNodes.map((node) => [node.id, node]))
    const clonedLinks = links.map((link) => ({
      ...link,
      source: byId.get(link.source) ?? (link.source as unknown as LayoutNode),
      target: byId.get(link.target) ?? (link.target as unknown as LayoutNode),
    })) as LayoutLink[]
    const generator = sankey<LayoutNode, LayoutLink>()
      .nodeId((node) => node.id)
      .nodeWidth(10)
      .nodePadding(10)
      .extent([
        [0, 4],
        [Math.max(1, size.width - 4), Math.max(1, size.height - 4)],
      ])
    return generator({ nodes: clonedNodes, links: clonedLinks })
  })()

  const linkPath = sankeyLinkHorizontal<LayoutNode, LayoutLink>()

  const linkNodes = graph.links.map((link, index) => {
    const path = svgElement('path', {
      d: linkPath(link) ?? '',
      fill: 'none',
      stroke: chartColor(index),
      'stroke-opacity': () => 0.25 + 0.55 * progress(),
      'stroke-width': Math.max(1, link.width ?? 1),
      class: styles.hit,
    })
    onChartEvent(path, 'pointerenter', () => setActive(link))
    onChartEvent(path, 'pointerleave', () => setActive(null))
    return path
  })

  const nodeNodes = graph.nodes.map((node, index) =>
    svgElement(
      'g',
      {},
      [
        svgElement('rect', {
          x: node.x0 ?? 0,
          y: node.y0 ?? 0,
          width: Math.max(1, (node.x1 ?? 0) - (node.x0 ?? 0)),
          height: Math.max(1, (node.y1 ?? 0) - (node.y0 ?? 0)),
          rx: 2,
          fill: chartColor(index),
          'fill-opacity': () => 0.3 + 0.7 * progress(),
        }),
        svgElement(
          'text',
          {
            x:
              (node.x0 ?? 0) < size.width / 2
                ? (node.x1 ?? 0) + 4
                : (node.x0 ?? 0) - 4,
            y: ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2,
            'text-anchor': (node.x0 ?? 0) < size.width / 2 ? 'start' : 'end',
            'dominant-baseline': 'middle',
            class: styles.tick,
          },
          [node.name],
        ),
      ],
    ),
  )

  const svg = svgElement(
    'svg',
    {
      width: size.width,
      height: size.height,
      viewBox: `0 0 ${size.width} ${size.height}`,
      role: 'group',
      'aria-label': 'Sankey diagram. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [
        `Sankey diagram with ${nodes.length} nodes and ${links.length} links`,
      ]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      ...linkNodes,
      ...nodeNodes,
    ],
  )

  return (
    <>
      {svg}
      <Show when={() => (active() == null ? null : String(active()))}>
        {() => {
          const link = active()
          if (!link) return null
          return (
            <ChartTooltip
              x={((link.source.x1 ?? 0) + (link.target.x0 ?? 0)) / 2}
              y={((link.source.y0 ?? 0) + (link.target.y0 ?? 0)) / 2}
              width={size.width}
            >
              <p className={styles.tooltipTitle}>
                {link.source.name} → {link.target.name}
              </p>
              <p className={styles.tooltipRow}>{valueFormat(link.value)}</p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function SankeyChart({
  nodes,
  links,
  height = 300,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: {
  nodes: SankeyNode[]
  links: SankeyLink[]
  height?: number
  title?: unknown
  description?: unknown
  className?: string
  animate?: boolean
  valueFormat?: (value: number) => string
  ariaLabel?: string
}) {
  const nodeNames = new Map(nodes.map((node) => [node.id, node.name]))

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={nodes.length === 0 || links.length === 0}
      table={{
        caption: typeof title === 'string' ? title : 'Sankey data',
        columns: [
          { key: 'source', label: 'Source' },
          { key: 'target', label: 'Target' },
          {
            key: 'value',
            label: 'Value',
            format: (value: unknown) =>
              typeof value === 'number' ? valueFormat(value) : '',
          },
        ],
        rows: links.map((link) => ({
          source: nodeNames.get(link.source) ?? link.source,
          target: nodeNames.get(link.target) ?? link.target,
          value: link.value,
        })),
      }}
    >
      {(size) => (
        <SankeyCanvas
          nodes={nodes}
          links={links}
          size={size}
          animate={animate}
          valueFormat={valueFormat}
        />
      )}
    </ChartFrame>
  )
}
