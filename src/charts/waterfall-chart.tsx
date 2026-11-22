import { scaleBand, scaleLinear } from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { compactNumber } from './chart-utils.ts'
import type { ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'
import type { ReactNode } from '../types.ts'

export type WaterfallDatum = {
  label: string
  value: number
  total?: boolean
}

function WaterfallCanvas({
  data,
  size,
  animate,
  valueFormat,
}: {
  data: WaterfallDatum[]
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
  const compact = width < 420
  const margin = { top: 12, right: 12, bottom: compact ? 30 : 36, left: compact ? 36 : 48 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)

  const resolved = data.reduce<
    Array<WaterfallDatum & { start: number; end: number }>
  >((rows, item) => {
    const previous = rows.at(-1)
    if (item.total) {
      rows.push({ ...item, start: 0, end: item.value })
      return rows
    }
    const start = previous?.end ?? 0
    rows.push({ ...item, start, end: start + item.value })
    return rows
  }, [])

  const values = resolved.flatMap((item) => [item.start, item.end, 0])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const y = scaleLinear()
    .domain([min, max === min ? min + 1 : max])
    .nice()
    .range([innerH, 0])
  const x = scaleBand<string>()
    .domain(data.map((item) => item.label))
    .range([0, innerW])
    .padding(0.28)
  const ticks = y.ticks(compact ? 3 : 4)

  const tickNodes = ticks.map((tick) =>
    svgElement(
      'g',
      {},
      [
        svgElement('line', {
          x1: 0,
          x2: innerW,
          y1: y(tick),
          y2: y(tick),
          'stroke-dasharray': '3 3',
          class: styles.gridLine,
        }),
        svgElement(
          'text',
          {
            x: -8,
            y: y(tick),
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            class: styles.tickNumeric,
          },
          [valueFormat(tick)],
        ),
      ],
    ),
  )

  const stepNodes = resolved.map((item, index) => {
    const geometry = () => {
      const animatedEnd = item.start + (item.end - item.start) * progress()
      const top = Math.min(y(item.start), y(animatedEnd))
      const bottom = Math.max(y(item.start), y(animatedEnd))
      return { top, bottom }
    }
    const color = item.total
      ? 'hsl(var(--chart-1))'
      : item.value >= 0
        ? 'hsl(var(--success))'
        : 'hsl(var(--destructive))'
    const group = svgElement(
      'g',
      { class: styles.hit },
      [
        svgElement('rect', {
          x: x(item.label) ?? 0,
          y: () => geometry().top,
          width: x.bandwidth(),
          height: () => Math.max(1, geometry().bottom - geometry().top),
          rx: 3,
          fill: color,
          opacity: 0.9,
        }),
        svgElement(
          'text',
          {
            x: (x(item.label) ?? 0) + x.bandwidth() / 2,
            y: innerH + 16,
            'text-anchor': 'middle',
            class: styles.tick,
          },
          [item.label.length > 8 ? `${item.label.slice(0, 8)}…` : item.label],
        ),
      ],
    )
    onChartEvent(group, 'pointerenter', () => setActive(index))
    onChartEvent(group, 'pointerleave', () => setActive(null))
    return group
  })

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    [...tickNodes, ...stepNodes],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Waterfall chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Waterfall chart with ${data.length} steps`]),
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
          const item = resolved[index]
          if (!item) return null
          return (
            <ChartTooltip
              x={margin.left + (x(item.label) ?? 0) + x.bandwidth() / 2}
              y={margin.top + Math.min(y(item.start), y(item.end))}
              width={width}
            >
              <p className={styles.tooltipTitle}>{item.label}</p>
              <p className={styles.tooltipRow}>
                {valueFormat(item.value)} → {valueFormat(item.end)}
              </p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function WaterfallChart({
  data,
  height = 280,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: {
  data: WaterfallDatum[]
  height?: number
  title?: ReactNode
  description?: ReactNode
  className?: string
  animate?: boolean
  valueFormat?: (value: number) => string
  ariaLabel?: string
}) {
  const rows = data.reduce<Array<{ label: string; value: number; running: number }>>(
    (acc, item) => {
      const running = item.total ? item.value : (acc.at(-1)?.running ?? 0) + item.value
      acc.push({ label: item.label, value: item.value, running })
      return acc
    },
    [],
  )

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={data.length === 0}
      table={{
        caption: typeof title === 'string' ? title : 'Waterfall data',
        columns: [
          { key: 'label', label: 'Step' },
          {
            key: 'value',
            label: 'Change',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
          {
            key: 'running',
            label: 'Running total',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
        ],
        rows,
      }}
    >
      {(size) => (
        <WaterfallCanvas
          data={data}
          size={size}
          animate={animate}
          valueFormat={valueFormat}
        />
      )}
    </ChartFrame>
  )
}
