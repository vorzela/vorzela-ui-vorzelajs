import { highlight } from 'sugar-high'
import { lang } from 'sugar-high/lang'
import { CopyButton } from '~/components/ui/copy-button.tsx'
import type { ReactNode } from '../../src/types.ts'
import styles from './docs.module.scss'

export interface SectionProps {
  id?: string
  title: string
  lead?: ReactNode
  children: ReactNode
}

export function Section({ id, title, lead, children }: SectionProps) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
      </div>
      {children}
    </section>
  )
}

export interface DemoProps {
  title?: string
  note?: string
  children: ReactNode
  className?: string
}

/** A bordered preview surface used across every docs page. */
export function Demo({ title = 'Preview', note, children, className }: DemoProps) {
  return (
    <div className={styles.demo}>
      <div className={styles.demoHeader}>
        <span className={styles.demoTitle}>{title}</span>
        {note ? <span className={styles.demoBadge}>{note}</span> : null}
      </div>
      <div className={`${styles.demoBody} ${className ?? ''}`}>{children}</div>
    </div>
  )
}

export function DemoStack({ children }: { children: ReactNode }) {
  return <div className={styles.demoStack}>{children}</div>
}

export function DemoField({ children }: { children: ReactNode }) {
  return <div className={styles.demoField}>{children}</div>
}

/**
 * Sugar-high returns escaped HTML. Parse it into a detached template and copy
 * only `<span>` wrappers and their text, so the docs app never injects arbitrary
 * markup from a code sample. Token colour comes from the inline
 * `color: var(--sh-…)` value, which flips with the theme.
 */
function copyHighlightedNodes(source: Node, target: Node): void {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.textContent ?? ''))
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const element = child as HTMLElement
    if (element.tagName !== 'SPAN') continue

    const span = document.createElement('span')
    const classes = (element.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((name) => name.startsWith('sh__'))
    if (classes.length > 0) span.className = classes.join(' ')

    const color = element.style.color
    if (color.startsWith('var(--sh-') && color.endsWith(')')) {
      span.style.color = color
    }

    copyHighlightedNodes(element, span)
    target.appendChild(span)
  }
}

function highlightedCode(code: string, language: string): unknown {
  const source = code.trim()
  if (typeof document === 'undefined') return source

  const canonical = lang(language) ?? 'javascript'
  const template = document.createElement('template')
  template.innerHTML = highlight(source, { lang: canonical })

  const element = document.createElement('code')
  copyHighlightedNodes(template.content, element)
  return element
}

export interface PropRow {
  name: string
  type: string
  defaultValue?: string
  description: string
}

/** Copyable source block. Highlighting is intentionally plain: the code is
 * data, so it never goes through an HTML sink. */
export function CodeBlock({
  code,
  language = 'tsx',
}: {
  code: string
  language?: string
}) {
  return (
    <div className={styles.code}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{language}</span>
        <CopyButton value={code} variant="ghost" size="sm" />
      </div>
      <pre className={styles.codeBody}>{highlightedCode(code, language) as string}</pre>
    </div>
  )
}

/** Compact API reference for a component's public props. */
export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className={`${styles.demo} ${styles.apiWrap}`}>
      <table className={styles.apiTable}>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className={styles.apiName}>{row.name}</td>
              <td className={styles.apiType}>{row.type}</td>
              <td className={styles.apiDefault}>{row.defaultValue ?? '—'}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
