import { effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf, useReducedMotion } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Button } from './button.tsx'
import { ChevronLeft, ChevronRight, Pause, Play } from './icons.tsx'
import styles from './carousel.module.scss'
import type {
  CSSProperties,
  ReactNode,
  SyntheticEvent,
} from '../../types.ts'

export interface CarouselSlide {
  id: string
  content: ReactNode
  alt?: string
}

export interface CarouselProps {
  slides: CarouselSlide[] | (() => CarouselSlide[])
  label?: string
  autoPlay?: boolean
  interval?: number
  loop?: boolean
  className?: string
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

/** Scroll-snap carousel with arrows, dots, and optional autoplay. */
export function Carousel({
  slides: slidesProp,
  label = 'Carousel',
  autoPlay = false,
  interval = 5000,
  loop = true,
  className,
}: CarouselProps) {
  const slides = accessorOf(slidesProp)
  const trackRef: { current: HTMLDivElement | null } = { current: null }
  const [index, setIndex] = signal(0)
  const [hovered, setHovered] = signal(false)
  const [userPaused, setUserPaused] = signal(false)
  const paused = (): boolean => hovered() || userPaused()
  const reduced = useReducedMotion()

  const goTo = (next: number): void => {
    const list = slides()
    if (list.length === 0) return

    const bounded = loop
      ? ((next % list.length) + list.length) % list.length
      : Math.max(0, Math.min(next, list.length - 1))

    setIndex(bounded)
    const track = trackRef.current
    if (track && typeof track.scrollTo === 'function') {
      track.scrollTo({
        left: bounded * track.clientWidth,
        behavior: reduced() ? 'auto' : 'smooth',
      })
    }
  }

  effect(() => {
    if (typeof window === 'undefined') return
    if (!autoPlay || paused() || reduced() || slides().length < 2) return

    const timer = window.setInterval(() => {
      const track = trackRef.current
      if (!track) return
      const current = Math.round(
        track.scrollLeft / Math.max(1, track.clientWidth),
      )
      goTo(current + 1)
    }, interval)

    onCleanup(() => window.clearInterval(timer))
  })

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cx(styles.root, className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusIn={() => setHovered(true)}
      onFocusOut={() => setHovered(false)}
    >
      <div
        ref={trackRef}
        className={styles.track}
        onScroll={(event: SyntheticEvent<HTMLDivElement>) => {
          const track = event.currentTarget
          const next = Math.round(
            track.scrollLeft / Math.max(1, track.clientWidth),
          )
          if (next !== index()) setIndex(next)
        }}
      >
        <For
          each={slides}
          key={(slide, slideIndex) =>
            `${slide.id}:${slideIndex}:${slides().length}`
          }
        >
          {(slide, slideIndex) => (
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${slides().length}`}
              className={styles.slide}
            >
              {slide.content}
            </div>
          )}
        </For>
      </div>

      <Show when={() => autoPlay && slides().length > 1}>
        {() => (
          <Button
            variant="outline"
            size="icon"
            className={cx(styles.control, styles.pause)}
            onClick={() => setUserPaused((value) => !value)}
            aria-label={reactive(() =>
              userPaused() ? 'Play slideshow' : 'Pause slideshow',
            )}
            aria-pressed={() => (userPaused() ? 'true' : 'false')}
          >
            <Show when={userPaused} fallback={<Pause aria-hidden />}>
              {() => <Play aria-hidden />}
            </Show>
          </Button>
        )}
      </Show>

      <Show when={() => slides().length > 1}>
        {() => (
          <>
            <Button
              variant="outline"
              size="icon"
              className={cx(styles.control, styles.previous)}
              onClick={() => goTo(index() - 1)}
              aria-label="Previous slide"
              disabled={reactive(() => !loop && index() === 0)}
            >
              <ChevronLeft aria-hidden />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={cx(styles.control, styles.next)}
              onClick={() => goTo(index() + 1)}
              aria-label="Next slide"
              disabled={reactive(
                () => !loop && index() === slides().length - 1,
              )}
            >
              <ChevronRight aria-hidden />
            </Button>

            <div className={styles.dots}>
              <Show
                when={() => slides().length > 4}
                fallback={() => (
                  <For
                    each={slides}
                    key={(slide, slideIndex) =>
                      `${slide.id}:${slideIndex}:${slides().length}`
                    }
                  >
                    {(_, slideIndex) => (
                      <button
                        type="button"
                        className={styles.dot}
                        onClick={() => goTo(slideIndex)}
                        aria-label={`Go to slide ${slideIndex + 1}`}
                        aria-current={() =>
                          slideIndex === index() ? 'true' : 'false'
                        }
                      />
                    )}
                  </For>
                )}
              >
                {() => (
                  <div
                    role="progressbar"
                    aria-label={reactive(
                      () => `Slide ${index() + 1} of ${slides().length}`,
                    )}
                    aria-valuemin={1}
                    aria-valuemax={() => slides().length}
                    aria-valuenow={() => index() + 1}
                    className={styles.progress}
                  >
                    <span className={styles.progressTrack}>
                      <span
                        className={styles.progressFill}
                        style={reactive(
                          () =>
                            ({
                              width: `${
                                ((index() + 1) /
                                  Math.max(1, slides().length)) *
                                100
                              }%`,
                            }) as CSSProperties,
                        )}
                      />
                    </span>
                    <span className={styles.progressCount}>
                      {() => `${index() + 1} / ${slides().length}`}
                    </span>
                  </div>
                )}
              </Show>
            </div>
          </>
        )}
      </Show>
    </section>
  )
}
