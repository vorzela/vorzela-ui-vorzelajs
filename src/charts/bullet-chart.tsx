import { scaleLinear } from 'd3'

import { svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { compactNumber } from './chart-utils.ts'
import type { ChartDatum, ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'
import type { ReactNode } from '../types.ts'

export type BulletDatum = {
  label: string
  value: number
  target: number
  max?: number
  ranges?: [number, number, number]
}

function BulletCanvas({
  data,
  size,
  animate,
  valueFormat,
}: {
  data: BulletDatum[]
  size: ChartSize
  animate: boolean
  valueFormat: (value: number) => string
}) {
  const progress = useAnimatedProgress({
    enabled: animate,
    resetKey: `${data.length}:${data.map((item) => item.value).join(',')}`,
  })

  const width = size.width
  const height = size.height
  const margin = { top: 8, right: 12, bottom: 8, left: 88 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)
  const rowHeight = innerH / Math.max(1, data.length)
  const barHeight = Math.min(18, rowHeight * 0.5)

  const rowNodes = data.map((item, index) => {
    const max = item.max ?? Math.max(item.value, item.target, 1)
    const x = scaleLinear().domain([0, max]).range([0, innerW])
    const top = index * rowHeight + (rowHeight - barHeight) / 2
    const ranges = item.ranges ?? [max * 0.6, max * 0.85, max]
    return svgElement(
      'g',
      {},
      [
        svgElement(
          'text',
          {
            x: -8,
            y: top + barHeight / 2,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            class: styles.tick,
          },
          [item.label.length > 12 ? `${item.label.slice(0, 12)}…` : item.label],
        ),
        ...ranges.map((range, rangeIndex) =>
          svgElement('rect', {
            x: 0,
            y: top,
            width: x(range),
            height: barHeight,
            rx: barHeight / 2,
            fill: 'hsl(var(--muted))',
            opacity: 0.25 + rangeIndex * 0.12,
          }),
        ),
        svgElement('rect', {
          x: 0,
          y: top + barHeight * 0.25,
          width: () => x(item.value) * progress(),
          height: barHeight * 0.5,
          rx: barHeight / 4,
          fill: 'hsl(var(--chart-1))',
        }),
        svgElement('line', {
          x1: x(item.target),
          x2: x(item.target),
          y1: top - 2,
          y2: top + barHeight + 2,
          stroke: 'hsl(var(--foreground))',
          'stroke-width': 2,
        }),
        svgElement(
          'text',
          {
            x: innerW,
            y: top + barHeight / 2,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            class: styles.tickNumeric,
          },
          [valueFormat(item.value)],
        ),
      ],
    )
  })

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    rowNodes,
  )

  return svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Bullet chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Bullet chart with ${data.length} rows`]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      group,
    ],
  )
}

export function BulletChart({
  data,
  height = 220,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: {
  data: BulletDatum[]
  height?: number
  title?: ReactNode
  description?: ReactNode
  className?: string
  animate?: boolean
  valueFormat?: (value: number) => string
  ariaLabel?: string
}) {
  return (
    <ChartFrame
      title={title}
      description={description}
      height={Math.max(height, data.length * 44 + 16)}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={data.length === 0}
      table={{
        caption: typeof title === 'string' ? title : 'Bullet data',
        columns: [
          { key: 'label', label: 'Metric' },
          {
            key: 'value',
            label: 'Value',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
          {
            key: 'target',
            label: 'Target',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
        ],
        rows: data as unknown as ChartDatum[],
      }}
    >
      {(size) => (
        <BulletCanvas data={data} size={size} animate={animate} valueFormat={valueFormat} />
      )}
    </ChartFrame>
  )
}
