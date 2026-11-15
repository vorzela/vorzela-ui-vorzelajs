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

export type Candle = {
  date: string
  open: number
  high: number
  low: number
  close: number
}

function CandleCanvas({
  data,
  size,
  animate,
  valueFormat,
}: {
  data: Candle[]
  size: ChartSize
  animate: boolean
  valueFormat: (value: number) => string
}) {
  const [active, setActive] = signal<number | null>(null)
  const progress = useAnimatedProgress({
    enabled: animate,
    resetKey: `${data.length}:${data[data.length - 1]?.close}`,
  })

  const width = size.width
  const height = size.height
  const compact = width < 420
  const margin = { top: 12, right: 12, bottom: compact ? 26 : 32, left: compact ? 36 : 48 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)

  const lows = data.map((item) => item.low)
  const highs = data.map((item) => item.high)
  const min = Math.min(...lows)
  const max = Math.max(...highs)
  const mid = (min + max) / 2
  const y = scaleLinear()
    .domain([min, max === min ? min + 1 : max])
    .nice()
    .range([innerH, 0])
  const animatedY = (value: number) => y(mid + (value - mid) * progress())
  const x = scaleBand<string>()
    .domain(data.map((item) => item.date))
    .range([0, innerW])
    .padding(0.25)
  const candleWidth = Math.max(2, x.bandwidth() * 0.62)
  const tickStep = Math.max(1, Math.ceil(data.length / (compact ? 4 : 7)))
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

  const candleNodes = data.map((item, index) => {
    const up = item.close >= item.open
    const color = up ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
    const cx = (x(item.date) ?? 0) + x.bandwidth() / 2
    const group = svgElement(
      'g',
      { class: styles.hit },
      [
        svgElement('line', {
          x1: cx,
          x2: cx,
          y1: () => animatedY(item.high),
          y2: () => animatedY(item.low),
          stroke: color,
          'stroke-width': 1,
        }),
        svgElement('rect', {
          x: cx - candleWidth / 2,
          y: () => Math.min(animatedY(item.open), animatedY(item.close)),
          width: candleWidth,
          height: () =>
            Math.max(1, Math.abs(animatedY(item.open) - animatedY(item.close))),
          rx: 1,
          fill: up ? color : 'hsl(var(--card))',
          stroke: color,
          'stroke-width': 1,
        }),
        index % tickStep === 0
          ? svgElement(
              'text',
              {
                x: cx,
                y: innerH + 16,
                'text-anchor': 'middle',
                class: styles.tick,
              },
              [item.date],
            )
          : null,
      ],
    )
    onChartEvent(group, 'pointerenter', () => setActive(index))
    onChartEvent(group, 'pointerleave', () => setActive(null))
    return group
  })

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    [...tickNodes, ...candleNodes],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Candlestick chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Candlestick chart with ${data.length} sessions`]),
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
          const candle = data[index]
          if (!candle) return null
          return (
            <ChartTooltip
              x={margin.left + (x(candle.date) ?? 0) + x.bandwidth() / 2}
              y={margin.top + y(candle.high)}
              width={width}
            >
              <p className={styles.tooltipTitle}>{candle.date}</p>
              <p className={styles.tooltipRow}>
                O {valueFormat(candle.open)} · H {valueFormat(candle.high)}
              </p>
              <p className={styles.tooltipRow}>
                L {valueFormat(candle.low)} · C {valueFormat(candle.close)}
              </p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function CandlestickChart({
  data,
  height = 280,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: {
  data: Candle[]
  height?: number
  title?: unknown
  description?: unknown
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
      table={{
        caption: typeof title === 'string' ? title : 'Candlestick data',
        columns: [
          { key: 'date', label: 'Date' },
          {
            key: 'open',
            label: 'Open',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
          {
            key: 'high',
            label: 'High',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
          {
            key: 'low',
            label: 'Low',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
          {
            key: 'close',
            label: 'Close',
            format: (value) => (typeof value === 'number' ? valueFormat(value) : ''),
          },
        ],
        rows: data as unknown as Array<Record<string, string | number>>,
      }}
    >
      {(size) => (
        <CandleCanvas data={data} size={size} animate={animate} valueFormat={valueFormat} />
      )}
    </ChartFrame>
  )
}
