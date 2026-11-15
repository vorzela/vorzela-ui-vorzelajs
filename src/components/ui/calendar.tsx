/**
 * Standalone Calendar UI — no portal, no input, just the panel.
 * Used by <DatePicker> (inside a portal popup) and dashboard widgets.
 *
 * Three views: day → month → year (drill-down via the header).
 */
import { batch, effect, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'

import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { ChevronLeft, ChevronRight } from './icons.tsx'
import styles from './calendar.module.scss'
import {
  buildDayGrid,
  cellToIso,
  DAY_NAMES_SHORT,
  MONTH_NAMES_FULL,
  MONTH_NAMES_SHORT,
  parseIso,
  todayIso,
} from './calendar-utils.ts'

export interface CalendarProps {
  /** Selected ISO date YYYY-MM-DD (or ''), value or signal accessor. */
  value?: string | (() => string | undefined)
  /** Called when user clicks a day */
  onSelect?: (iso: string) => void
  /** Disable dates before this ISO */
  min?: string | (() => string | undefined)
  /** Disable dates after this ISO */
  max?: string | (() => string | undefined)
  /** Show "Today" shortcut in the footer */
  showToday?: boolean
  /** Extra class on the root div */
  className?: string
  /**
   * If provided, the calendar starts at this year/month instead of the
   * selected value (or today). Useful for controlled external state.
   */
  initialYear?: number
  initialMonth?: number
  /**
   * ISO date used to mark "today" (YYYY-MM-DD). Pass a server-computed value
   * to keep server and client output identical.
   */
  today?: string
}

function seedDate(
  value: string | undefined,
  initialYear: number | undefined,
  initialMonth: number | undefined,
  todayDt: Date,
): Date {
  const sel = parseIso(value ?? '')
  if (sel) return sel
  if (initialYear !== undefined && initialMonth !== undefined) {
    return new Date(initialYear, initialMonth, 1)
  }
  return todayDt
}

export function Calendar({
  value,
  onSelect,
  min,
  max,
  showToday = true,
  className,
  initialYear,
  initialMonth,
  today: todayProp,
}: CalendarProps) {
  const valueAccessor = accessorOf<string | undefined>(value)
  const minAccessor = accessorOf<string | undefined>(min)
  const maxAccessor = accessorOf<string | undefined>(max)

  // Client-only flag. `window` is absent during SSR, and hydration's structure
  // scan suppresses user effects, so the server and the first client pass agree
  // before the real render mounts the calendar.
  const [mounted, setMounted] = signal(false)
  effect(() => {
    if (typeof window === 'undefined') return
    setMounted(true)
  })

  const providedToday = parseIso(todayProp ?? '') ? todayProp! : ''
  const today = providedToday || todayIso()
  const todayDt = parseIso(today)!

  const seeded = seedDate(
    valueAccessor(),
    initialYear,
    initialMonth,
    todayDt,
  )
  const [cursorYear, setCursorYear] = signal(seeded.getFullYear())
  const [cursorMonth, setCursorMonth] = signal(seeded.getMonth())
  const [view, setView] = signal<'day' | 'month' | 'year'>('day')

  const selectedIso = () => valueAccessor() ?? ''
  const selectedDate = () => parseIso(selectedIso())
  // Hide "today" markers until hydration so a server in another timezone
  // cannot render a different day than the client. An explicit `today` prop
  // is deterministic and is kept for both renders.
  const displayToday = () => (mounted() ? today : providedToday)
  const displayTodayDt = () => parseIso(displayToday())
  const hasExplicitSeed =
    Boolean(valueAccessor()) ||
    (initialYear !== undefined && initialMonth !== undefined) ||
    Boolean(providedToday)

  const prevMonth = () => {
    const month = cursorMonth()
    batch(() => {
      if (month === 0) {
        setCursorYear((year) => year - 1)
        setCursorMonth(11)
      } else {
        setCursorMonth(month - 1)
      }
    })
  }
  const nextMonth = () => {
    const month = cursorMonth()
    batch(() => {
      if (month === 11) {
        setCursorYear((year) => year + 1)
        setCursorMonth(0)
      } else {
        setCursorMonth(month + 1)
      }
    })
  }
  const prevYear = () => setCursorYear((year) => year - 1)
  const nextYear = () => setCursorYear((year) => year + 1)

  const decadeStart = (year: number) => Math.floor(year / 12) * 12
  const prevDecade = () => setCursorYear((year) => year - 12)
  const nextDecade = () => setCursorYear((year) => year + 12)

  const dayGrid = () => buildDayGrid(cursorYear(), cursorMonth())
  const yearGrid = () => {
    const start = decadeStart(cursorYear())
    return Array.from({ length: 12 }, (_, index) => start + index)
  }

  // Without a value, initial month or explicit `today`, the starting month is
  // only knowable on the client — render nothing on the server so the markup
  // cannot disagree with the hydrated output.
  if (!mounted() && !hasExplicitSeed) return null

  const isDisabled = (iso: string) => {
    const minValue = minAccessor()
    const maxValue = maxAccessor()
    if (minValue && iso < minValue) return true
    if (maxValue && iso > maxValue) return true
    return false
  }

  const handleDayClick = (iso: string) => {
    if (isDisabled(iso)) return
    onSelect?.(iso)
  }

  return (
    <div className={cx(styles.root, className)}>
      <Show when={() => view() === 'day'}>
        {() => (
          <>
            <div className={styles.header}>
              <button
                type="button"
                onClick={prevMonth}
                className={styles.navButton}
                aria-label="Previous month"
              >
                <ChevronLeft aria-hidden size={15} />
              </button>
              <button
                type="button"
                onClick={() => setView('month')}
                className={styles.headerButton}
              >
                {() => `${MONTH_NAMES_FULL[cursorMonth()]} ${cursorYear()}`}
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className={styles.navButton}
                aria-label="Next month"
              >
                <ChevronRight aria-hidden size={15} />
              </button>
            </div>

            <div className={styles.weekdays}>
              {DAY_NAMES_SHORT.map((name) => (
                <div className={styles.weekday}>
                  <span className={styles.weekdayLabel}>{name}</span>
                </div>
              ))}
            </div>

            <div className={styles.grid}>
              <For each={dayGrid} key={(cell) => cellToIso(cell)}>
                {(cell) => {
                  const iso = cellToIso(cell)
                  const disabled = () => isDisabled(iso)
                  const selected = () => iso === selectedIso()
                  const isToday = () => iso === displayToday()

                  return (
                    <div className={styles.dayCell}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDayClick(iso)}
                        aria-label={iso}
                        aria-pressed={() => (selected() ? 'true' : 'false')}
                        className={() =>
                          cx(
                            styles.day,
                            disabled() && styles.dayDisabled,
                            !disabled() && selected() && styles.daySelected,
                            !disabled() &&
                              !selected() &&
                              isToday() &&
                              styles.dayToday,
                            !disabled() &&
                              !selected() &&
                              !isToday() &&
                              cell.outside &&
                              styles.dayOutside,
                          )
                        }
                      >
                        {cell.day}
                      </button>
                    </div>
                  )
                }}
              </For>
            </div>

            {showToday ? (
              <div className={styles.footer}>
                <button
                  type="button"
                  disabled={() => isDisabled(displayToday())}
                  onClick={() => {
                    setCursorYear(todayDt.getFullYear())
                    setCursorMonth(todayDt.getMonth())
                    handleDayClick(today)
                  }}
                  className={styles.todayButton}
                >
                  Today
                </button>
              </div>
            ) : null}
          </>
        )}
      </Show>

      <Show when={() => view() === 'month'}>
        {() => (
          <>
            <div className={styles.header}>
              <button
                type="button"
                onClick={prevYear}
                className={styles.navButton}
                aria-label="Previous year"
              >
                <ChevronLeft aria-hidden size={15} />
              </button>
              <button
                type="button"
                onClick={() => setView('year')}
                className={styles.headerButton}
              >
                {() => String(cursorYear())}
              </button>
              <button
                type="button"
                onClick={nextYear}
                className={styles.navButton}
                aria-label="Next year"
              >
                <ChevronRight aria-hidden size={15} />
              </button>
            </div>

            <div className={styles.choiceGrid}>
              {MONTH_NAMES_SHORT.map((name, index) => {
                const selected = () =>
                  selectedDate()?.getFullYear() === cursorYear() &&
                  selectedDate()?.getMonth() === index
                const isNow = () =>
                  displayTodayDt()?.getFullYear() === cursorYear() &&
                  displayTodayDt()?.getMonth() === index

                return (
                  <button
                    type="button"
                    onClick={() => {
                      setCursorMonth(index)
                      setView('day')
                    }}
                    aria-pressed={() => (selected() ? 'true' : 'false')}
                    className={() =>
                      cx(
                        styles.choice,
                        selected() && styles.choiceSelected,
                        !selected() && isNow() && styles.choiceToday,
                      )
                    }
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </Show>

      <Show when={() => view() === 'year'}>
        {() => (
          <>
            <div className={styles.header}>
              <button
                type="button"
                onClick={prevDecade}
                className={styles.navButton}
                aria-label="Previous decade"
              >
                <ChevronLeft aria-hidden size={15} />
              </button>
              <div className={cx(styles.headerButton, styles.headerStatic)}>
                {() => `${yearGrid()[0]} – ${yearGrid()[11]}`}
              </div>
              <button
                type="button"
                onClick={nextDecade}
                className={styles.navButton}
                aria-label="Next decade"
              >
                <ChevronRight aria-hidden size={15} />
              </button>
            </div>

            <div className={styles.choiceGrid}>
              <For each={yearGrid} key={(year) => year}>
                {(year) => {
                  const selected = () =>
                    selectedDate()?.getFullYear() === year
                  const isNow = () =>
                    displayTodayDt()?.getFullYear() === year

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setCursorYear(year)
                        setView('month')
                      }}
                      aria-pressed={() => (selected() ? 'true' : 'false')}
                      className={() =>
                        cx(
                          styles.choice,
                          selected() && styles.choiceSelected,
                          !selected() && isNow() && styles.choiceToday,
                        )
                      }
                    >
                      {year}
                    </button>
                  )
                }}
              </For>
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
