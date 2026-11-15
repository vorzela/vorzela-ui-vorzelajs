import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import styles from './slider.module.scss'

export interface SliderProps {
  value?: number | (() => number)
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  label?: string
  className?: string
  disabled?: boolean
}

export function Slider({
  value: valueProp = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  className,
  disabled,
}: SliderProps) {
  const value = accessorOf<number>(valueProp)
  const span = max - min

  const percent = (): number => {
    const ratio = span > 0 ? (value() - min) / span : 0
    return Math.min(100, Math.max(0, ratio * 100))
  }

  return (
    <div className={cx(styles.root, disabled && styles.disabled, className)}>
      {label ? (
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{() => value()}</span>
        </div>
      ) : null}

      <div className={styles.rail}>
        <span
          className={styles.fill}
          style={() => ({ inlineSize: `${percent()}%` })}
          aria-hidden
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={label ?? 'Slider'}
          onChange={(event) =>
            onChange?.(Number((event.currentTarget as HTMLInputElement).value))
          }
          className={styles.control}
        />
      </div>
    </div>
  )
}
