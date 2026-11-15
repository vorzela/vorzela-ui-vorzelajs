import { scaleLinear } from 'd3'

import { svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { chartColor, compactNumber } from './chart-utils.ts'
import type { ChartDatum, ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'

export type FunnelDatum = { label: string; value: number }

function FunnelCanvas({
  data,
  size,
  animate,
  valueFormat,
}: {
  data: FunnelDatum[]
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
  const margin = { top: 8, right: 20, bottom: 8, left: 88 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)
  const max = Math.max(1, ...data.map((item) => item.value))
  const x = scaleLinear().domain([0, max]).range([0, innerW])
  const rowHeight = innerH / Math.max(1, data.length)
  const gap = Math.min(8, rowHeight * 0.18)

  const stageNodes = data.map((item, index) => {
    const nextValue = data[index + 1]?.value ?? item.value * 0.85
    const top = index * rowHeight + gap / 2
    const bottom = (index + 1) * rowHeight - gap / 2
    const center = innerW / 2
    const points = () => {
      const topWidth = x(item.value) * progress()
      const bottomWidth = x(nextValue) * progress()
      return [
        `${center - topWidth / 2},${top}`,
        `${center + topWidth / 2},${top}`,
        `${center + bottomWidth / 2},${bottom}`,
        `${center - bottomWidth / 2},${bottom}`,
      ].join(' ')
    }

    return svgElement(
      'g',
      {},
      [
        svgElement('polygon', {
          points,
          fill: chartColor(index),
          opacity: 0.85,
        }),
        svgElement(
          'text',
          {
            x: -8,
            y: (top + bottom) / 2,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            class: styles.tick,
          },
          [item.label.length > 12 ? `${item.label.slice(0, 12)}…` : item.label],
        ),
        svgElement(
          'text',
          {
            x: center,
            y: (top + bottom) / 2,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            class: styles.labelOnMark,
          },
          [valueFormat(item.value)],
        ),
      ],
    )
  })

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    stageNodes,
  )

  return svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Funnel chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Funnel with ${data.length} stages`]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      group,
    ],
  )
}

export function FunnelChart({
  data,
  height = 260,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: {
  data: FunnelDatum[]
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
      height={Math.max(height, data.length * 46 + 16)}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={data.length === 0}
      table={{
        caption: typeof title === 'string' ? title : 'Funnel data',
        columns: [
          { key: 'label', label: 'Stage' },
          {
            key: 'value',
            label: 'Value',
            format: (value: unknown) =>
              typeof value === 'number' ? valueFormat(value) : '',
          },
        ],
        rows: data as unknown as ChartDatum[],
      }}
    >
      {(size) => (
        <FunnelCanvas data={data} size={size} animate={animate} valueFormat={valueFormat} />
      )}
    </ChartFrame>
  )
}
