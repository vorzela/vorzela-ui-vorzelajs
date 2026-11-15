import { accessorOf } from '../../hooks/index.ts'
import { Clock } from './icons.tsx'
import { Input } from './input.tsx'

export interface TimePickerProps {
  label?: string
  value?: string | (() => string)
  defaultValue?: string
  onChange?: (value: string) => void
  hint?: string
  min?: string
  max?: string
  step?: number
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
}

/** Native time field with a clock adornment and ISO 24-hour value. */
export function TimePicker({
  label,
  value: valueProp,
  defaultValue,
  onChange,
  hint,
  min,
  max,
  step = 900,
  disabled,
  required,
  className,
  id,
}: TimePickerProps) {
  const value =
    valueProp === undefined ? defaultValue : accessorOf<string>(valueProp)

  return (
    <Input
      id={id}
      type="time"
      label={label}
      hint={hint}
      // InputProps types `value` as a plain string; the DOM binding accepts an
      // accessor so a controlled time stays reactive.
      value={value as unknown as string | undefined}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      required={required}
      className={className}
      leading={<Clock aria-hidden />}
      onChange={(event: globalThis.Event) =>
        onChange?.((event.currentTarget as HTMLInputElement).value)
      }
    />
  )
}
