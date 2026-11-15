import { For, Show } from '@vorzelajs/dom'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import styles from './chat.module.scss'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: ReactNode
  name?: string
  time?: string
  avatar?: ReactNode
}

export interface ChatProps {
  messages: ChatMessage[] | (() => ChatMessage[])
  className?: string
  empty?: ReactNode
}

/** Conversation transcript. */
export function Chat({
  messages,
  className,
  empty = 'No messages yet.',
}: ChatProps) {
  const list = typeof messages === 'function' ? messages : () => messages

  return (
    <div className={cx(styles.root, className)} role="log" aria-live="polite">
      <Show when={() => list().length === 0}>
        <p className={styles.empty}>{empty}</p>
      </Show>
      <For each={list}>
        {(message) => (
          <article className={cx(styles.message, styles[message.role])}>
            {message.avatar ? <div className={styles.avatar}>{message.avatar}</div> : null}
            <div className={styles.body}>
              <header className={styles.meta}>
                <span className={styles.name}>{message.name ?? message.role}</span>
                {message.time ? <time className={styles.time}>{message.time}</time> : null}
              </header>
              <div className={styles.content}>{message.content}</div>
            </div>
          </article>
        )}
      </For>
    </div>
  )
}
