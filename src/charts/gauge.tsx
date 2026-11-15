import { arc } from 'd3'
import { effect, onCleanup, signal } from '@vorzelajs/core'

import { useContainerSize } from '../hooks/index.ts'
import { cx } from '../lib/cx.ts'
import { mountChart, svgElement } from './chart-dom.ts'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { clamp, compactNumber } from './chart-utils.ts'
import type { ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'

export function Gauge({
  value,
  max = 100,
  height = 180,
  label,
  valueFormat = compactNumber,
  color = 'hsl(var(--chart-1))',
  animate = true,
  className,
}: {
  value: number
  max?: number
  height?: number
  label?: string
  valueFormat?: (value: number) => string
  color?: string
  animate?: boolean
  className?: string
}) {
  const { ref: measureRef, width } = useContainerSize<HTMLDivElement>()
  const [host, setHost] = signal<HTMLDivElement | null>(null)
  const progress = useAnimatedProgress({
    enabled: animate,
    duration: 700,
    resetKey: `${value}:${max}`,
  })

  const ratio = clamp(value / Math.max(1, max), 0, 1)
  const centerY = height - 14
  const start = -Math.PI / 2
  const end = Math.PI / 2

  effect(() => {
    const node = host()
    if (!node) return
    const measured = width()
    if (measured <= 0) return

    onCleanup(
      mountChart(node, () => {
        const size: ChartSize = { width: measured, height }
        const radius = Math.max(1, Math.min(size.width / 2 - 16, centerY - 10))
        const inner = radius * 0.72
        const arcGen = arc<{ startAngle: number; endAngle: number }>()
          .innerRadius(inner)
          .outerRadius(radius)
          .cornerRadius(4)

        return svgElement(
          'svg',
          {
            width: measured,
            height,
            viewBox: `0 0 ${measured} ${height}`,
            'aria-hidden': 'true',
          },
          [
            svgElement(
              'g',
              { transform: `translate(${measured / 2},${centerY})` },
              [
                svgElement('path', {
                  d: arcGen({ startAngle: start, endAngle: end }) ?? '',
                  fill: 'hsl(var(--muted))',
                }),
                svgElement('path', {
                  d: () =>
                    arcGen({
                      startAngle: start,
                      endAngle: start + (end - start) * ratio * progress(),
                    }) ?? '',
                  fill: color,
                }),
                svgElement(
                  'text',
                  {
                    y: -radius * 0.34,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    class: styles.centerValue,
                  },
                  [valueFormat(value)],
                ),
                label
                  ? svgElement(
                      'text',
                      {
                        y: -radius * 0.06,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'middle',
                        class: styles.tick,
                      },
                      [label],
                    )
                  : null,
              ],
            ),
          ],
        )
      }),
    )
  })

  return (
    <div
      ref={(node) => {
        const element = node as HTMLDivElement | null
        measureRef(element)
        setHost(element)
      }}
      className={cx(styles.fluid, className)}
      style={{ height }}
      role="img"
      aria-label={`${label ?? 'Gauge'}: ${valueFormat(value)} of ${valueFormat(max)}`}
    />
  )
}
