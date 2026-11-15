import { createRoot, effect, onCleanup } from '@vorzelajs/core'
import { normalize } from '@vorzelajs/dom'

/**
 * The Vorzela JSX runtime creates HTML elements, so SVG trees are built with
 * the namespaced DOM APIs and bound attributes are updated through signals.
 */
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export type ChartAttribute = string | number | boolean | null | undefined
export type Reactive<T> = T | (() => T)
export type SvgAttributes = Record<string, Reactive<ChartAttribute>>
export type SvgChild =
  | Node
  | string
  | number
  | null
  | false
  | undefined
  | (() => string | number | null | undefined)

function stringify(value: unknown): string {
  return value == null || value === false || value === true ? '' : String(value)
}

function setAttribute(element: Element, name: string, value: ChartAttribute): void {
  if (value == null || value === false) {
    element.removeAttribute(name)
    return
  }
  if (value === true) {
    element.setAttribute(name, '')
    return
  }
  element.setAttribute(name, String(value))
}

function appendChild(parent: Element, child: SvgChild): void {
  if (child == null || child === false) return

  if (typeof child === 'function') {
    const text = document.createTextNode('')
    effect(() => {
      text.data = stringify((child as () => unknown)())
    })
    parent.appendChild(text)
    return
  }

  if (typeof child === 'object') {
    parent.appendChild(child)
    return
  }

  parent.appendChild(document.createTextNode(String(child)))
}

/** Creates an SVG element. Function-valued attributes stay reactive. */
export function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: SvgAttributes = {},
  children: SvgChild[] = [],
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NAMESPACE, tag)
  const reactive: Array<[string, () => ChartAttribute]> = []

  for (const [name, value] of Object.entries(attributes)) {
    if (typeof value === 'function') {
      reactive.push([name, value as () => ChartAttribute])
    } else {
      setAttribute(element, name, value)
    }
  }

  // One effect per element keeps a mark to a single dependency read, even
  // when several of its attributes animate together.
  if (reactive.length) {
    effect(() => {
      for (const [name, read] of reactive) {
        setAttribute(element, name, read())
      }
    })
  }

  for (const child of children) appendChild(element, child)

  return element as SVGElementTagNameMap[K]
}

/** Adds a listener and removes it when the owning chart root is disposed. */
export function onChartEvent(
  target: EventTarget,
  type: string,
  listener: EventListener,
): void {
  target.addEventListener(type, listener)
  onCleanup(() => target.removeEventListener(type, listener))
}

/**
 * Builds chart content inside a disposable root and swaps it into `host`.
 * Rebuilding (resize) disposes the previous effects instead of leaking them.
 */
export function mountChart(host: Element, build: () => unknown): () => void {
  return createRoot((dispose) => {
    const view = normalize(build())
    host.replaceChildren(view)
    return () => {
      dispose()
      host.replaceChildren()
    }
  })
}
