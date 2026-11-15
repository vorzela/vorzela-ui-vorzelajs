/**
 * Flag + dial-code country selector with local number input.
 * Outputs full E.164 format: "+254712345678"
 */
import { computed, effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import type { PhoneCountry } from '../../lib/phone-countries.ts'
import {
  flagUrl,
  parsePhoneNumber,
  PHONE_COUNTRIES,
} from '../../lib/phone-countries.ts'
import { ChevronDown, CircleAlert } from './icons.tsx'
import { Label } from './label.tsx'
import styles from './phone-input.module.scss'

const DEFAULT_ISO2 = 'KE'

function defaultCountry(): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((country) => country.iso2 === DEFAULT_ISO2) ??
    (PHONE_COUNTRIES[0] as PhoneCountry)
  )
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

export interface PhoneInputProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  /** Full E.164 value, e.g. "+254712345678" or "". Accepts a signal accessor. */
  value?: string | null | (() => string | null)
  onChange?: (full: string) => void
  onBlur?: () => void
  disabled?: boolean
  wrapClass?: string
}

export function PhoneInput({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  onBlur,
  disabled,
  wrapClass,
}: PhoneInputProps) {
  const valueAccessor = accessorOf(value ?? '')
  const external = valueAccessor() ?? ''
  const initialParsed = parsePhoneNumber(external)

  const [country, setCountry] = signal<PhoneCountry>(
    initialParsed?.country ?? defaultCountry(),
  )
  const [local, setLocal] = signal(initialParsed?.local ?? '')
  const [synced, setSynced] = signal(external)
  const [open, setOpen] = signal(false)
  const [search, setSearch] = signal('')

  const wrapRef: { current: HTMLDivElement | null } = { current: null }
  const searchRef: { current: HTMLInputElement | null } = { current: null }
  const id = useId('phone-input')
  const listboxId = `${id}-listbox`

  effect(() => {
    const next = valueAccessor() ?? ''
    if (next === synced()) return
    const parsed = parsePhoneNumber(next)
    setCountry(parsed?.country ?? defaultCountry())
    setLocal(parsed?.local ?? '')
    setSynced(next)
  })

  const filteredCountries = computed(() => {
    const query = search().toLowerCase().trim()
    if (!query) return PHONE_COUNTRIES
    return PHONE_COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.dialCode.includes(query) ||
        item.iso2.toLowerCase().includes(query),
    )
  })
  const hasCountries = computed(() => filteredCountries().length > 0)

  function emit(nextCountry: PhoneCountry, nextLocal: string): void {
    const digits = nextLocal.replace(/\D/g, '')
    const full = digits ? `+${nextCountry.dialCode}${digits}` : ''
    onChange?.(full)
  }

  function handleLocalInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement
    const digits = target.value.replace(/[^0-9]/g, '')
    setLocal(digits)
    emit(country(), digits)
  }

  function selectCountry(next: PhoneCountry): void {
    setCountry(next)
    setOpen(false)
    setSearch('')
    emit(next, local())
  }

  effect(() => {
    const onDocClick = (event: globalThis.MouseEvent): void => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick, true)
    onCleanup(() => document.removeEventListener('click', onDocClick, true))
  })

  effect(() => {
    if (!open()) return
    queueMicrotask(() => {
      if (open()) searchRef.current?.focus({ preventScroll: true })
    })
  })

  const hasError = Boolean(error)

  return (
    <div className={cx(styles.root, wrapClass)} ref={wrapRef}>
      {label ? (
        <Label htmlFor={id} required={required} hint={hint} hintId={`${id}-hint`}>
          {label}
        </Label>
      ) : null}

      <div className={styles.field}>
        <div
          className={cx(
            styles.row,
            hasError && styles.invalid,
            disabled && styles.disabled,
          )}
        >
          <button
            type="button"
            className={styles.countryButton}
            onClick={() => setOpen(!open())}
            aria-label={() =>
              `Country code: ${country().name} +${country().dialCode}. Change country`
            }
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={() => (open() ? listboxId : undefined)}
          >
            <img
              src={() => flagUrl(country().iso2)}
              alt=""
              width={24}
              height={18}
              className={styles.flag}
              loading="lazy"
            />
            <span className={styles.dialCode}>{() => `+${country().dialCode}`}</span>
            <ChevronDown
              aria-hidden
              className={reactive(() =>
                cx(styles.chevron, open() && styles.chevronOpen),
              )}
            />
          </button>

          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={() => country().placeholder}
            disabled={disabled}
            value={local}
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            onChange={handleLocalInput}
            onInput={handleLocalInput}
            onBlur={onBlur}
            className={styles.input}
          />

          {hasError ? (
            <span className={styles.errorIcon}>
              <CircleAlert size={16} aria-hidden />
            </span>
          ) : null}
        </div>

        <Show when={open}>
          {() => (
            <div
              id={listboxId}
              role="listbox"
              aria-label="Countries"
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                  event.stopPropagation()
                  setOpen(false)
                }
              }}
              className={styles.dropdown}
            >
              <div className={styles.searchWrap}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search country or code…"
                  aria-label="Search countries"
                  autoComplete="off"
                  value={search}
                  onChange={(event) => {
                    const target = event.currentTarget as HTMLInputElement
                    setSearch(target.value)
                  }}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.list}>
                <Show
                  when={hasCountries}
                  fallback={<p className={styles.empty}>No countries found</p>}
                >
                  {() => (
                    <For
                      each={filteredCountries}
                      key={(item) => item.iso2}
                    >
                      {(item) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={() => country().iso2 === item.iso2}
                          className={() =>
                            cx(
                              styles.option,
                              country().iso2 === item.iso2 &&
                                styles.optionSelected,
                            )
                          }
                          onClick={() => selectCountry(item)}
                        >
                          <img
                            src={flagUrl(item.iso2)}
                            alt=""
                            width={24}
                            height={18}
                            className={styles.flag}
                            loading="lazy"
                          />
                          <span className={styles.optionName}>{item.name}</span>
                          <span className={styles.optionCode}>+{item.dialCode}</span>
                        </button>
                      )}
                    </For>
                  )}
                </Show>
              </div>
            </div>
          )}
        </Show>
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className={cx(styles.message, styles.errorText)}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
