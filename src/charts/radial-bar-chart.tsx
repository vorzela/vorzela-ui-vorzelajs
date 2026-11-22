import { arc } from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { cx } from '../lib/cx.ts'
import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { chartColor, compactNumber } from './chart-utils.ts'
import type { ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'
import type { ReactNode } from '../types.ts'

export type RadialBarDatum = { label: string; value: number }

function RadialBarCanvas({
  data,
  max,
  size,
  animate,
  valueFormat,
}: {
  data: RadialBarDatum[]
  max?: number
  size: ChartSize
  animate: boolean
  valueFormat: (value: number) => string
}) {
  const [active, setActive] = signal<number | null>(null)
  const progress = useAnimatedProgress({
    enabled: animate,
    resetKey: `${data.length}:${data.map((item) => item.value).join(',')}`,
  })

  const width = size.width
  const height = size.height
  const radius = Math.max(1, Math.min(width, height) / 2 - 18)
  const maxValue = max ?? Math.max(1, ...data.map((item) => item.value))
  const ring = (radius - radius * 0.35) / Math.max(1, data.length)

  const ringNodes = data.map((item, index) => {
    const inner = radius * 0.35 + index * ring
    const outer = inner + ring * 0.72
    const arcGen = arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(inner)
      .outerRadius(outer)
      .cornerRadius(3)
    const path = svgElement('path', {
      d: () =>
        arcGen({
          startAngle: 0,
          endAngle: (item.value / maxValue) * Math.PI * 2 * progress(),
        }) ?? '',
      fill: chartColor(index),
      opacity: () => {
        const current = active()
        return current != null && current !== index ? 0.5 : 1
      },
      class: cx(styles.hit, styles.fade),
    })
    onChartEvent(path, 'pointerenter', () => setActive(index))
    onChartEvent(path, 'pointerleave', () => setActive(null))
    return svgElement(
      'g',
      {},
      [
        svgElement('path', {
          d: arcGen({ startAngle: 0, endAngle: Math.PI * 2 }) ?? '',
          fill: 'hsl(var(--muted))',
        }),
        path,
      ],
    )
  })

  const group = svgElement(
    'g',
    { transform: `translate(${width / 2},${height / 2})` },
    [
      ...ringNodes,
      svgElement(
        'text',
        {
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          class: styles.centerValue,
        },
        [valueFormat(data.reduce((sum, item) => sum + item.value, 0))],
      ),
    ],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Radial bar chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Radial bar chart with ${data.length} rings`]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      group,
    ],
  )

  return (
    <>
      {svg}
      <Show when={() => (active() == null ? null : String(active()))}>
        {() => {
          const index = active()
          if (index == null) return null
          const item = data[index]
          if (!item) return null
          return (
            <ChartTooltip x={width / 2} y={height / 2 - radius} width={width}>
              <p className={styles.tooltipTitle}>{item.label}</p>
              <p className={styles.tooltipRow}>{valueFormat(item.value)}</p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function RadialBarChart({
  data,
  max,
  height = 280,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: {
  data: RadialBarDatum[]
  max?: number
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
      height={height}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={data.length === 0}
      legend={data.map((item, index) => ({
        label: item.label,
        color: chartColor(index),
        shape: 'circle',
      }))}
      table={{
        caption: typeof title === 'string' ? title : 'Radial bar data',
        columns: [
          { key: 'label', label: 'Label' },
          {
            key: 'value',
            label: 'Value',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
        ],
        rows: data,
      }}
    >
      {(size) => (
        <RadialBarCanvas
          data={data}
          max={max}
          size={size}
          animate={animate}
          valueFormat={valueFormat}
        />
      )}
    </ChartFrame>
  )
}
