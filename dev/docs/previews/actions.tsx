import { signal } from '@vorzelajs/core'
import { Button } from '~/components/ui/button.tsx'
import { ButtonGroup } from '~/components/ui/button-group.tsx'
import { CloseButton } from '~/components/ui/close-button.tsx'
import { CopyButton } from '~/components/ui/copy-button.tsx'
import { FloatButton } from '~/components/ui/float-button.tsx'
import {
  Bold,
  Italic,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from '~/components/ui/icons.tsx'
import { Link } from '~/components/ui/link.tsx'
import { Toggle } from '~/components/ui/toggle.tsx'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group.tsx'
import styles from '../docs.module.scss'

function ButtonPreview() {
  return (
    <>
      <div class={styles.demoRow}>
        <Button>Continue</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">
          <Trash2 aria-hidden />
          Delete
        </Button>
        <Button variant="link">Link</Button>
      </div>
      <div class={styles.demoRow}>
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add item">
          <Plus aria-hidden />
        </Button>
        <Button disabled>Saving…</Button>
      </div>
    </>
  )
}

function ButtonGroupPreview() {
  return (
    <div class={styles.demoStack}>
      <ButtonGroup>
        <Button variant="outline">Day</Button>
        <Button variant="outline">Week</Button>
        <Button variant="outline">Month</Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical">
        <Button variant="secondary">Top</Button>
        <Button variant="secondary">Middle</Button>
        <Button variant="secondary">Bottom</Button>
      </ButtonGroup>
    </div>
  )
}

function CopyButtonPreview() {
  return (
    <div class={styles.demoRow}>
      <CopyButton value="npm run dev" />
      <CopyButton value="vorzelajs-ui add button" label="Copy command" variant="secondary" />
    </div>
  )
}

function CloseButtonPreview() {
  return (
    <div class={styles.demoRow}>
      <CloseButton />
      <CloseButton size="lg" label="Dismiss banner" />
    </div>
  )
}

function TogglePreview() {
  const [pressed, setPressed] = signal(false)
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Toggle aria-label="Bold" onPressedChange={setPressed}>
          <Bold aria-hidden />
        </Toggle>
        <Toggle aria-label="Italic" variant="outline">
          <Italic aria-hidden />
        </Toggle>
        <Toggle aria-label="Disabled" disabled>
          <Sparkles aria-hidden />
        </Toggle>
      </div>
      <p class={styles.cardText}>
        Bold is {() => (pressed() ? 'on' : 'off')}.
      </p>
    </div>
  )
}

function ToggleGroupPreview() {
  const [value, setValue] = signal<string | string[]>('center')
  return (
    <div class={styles.demoStack}>
      <ToggleGroup value={value} onValueChange={setValue} aria-label="Alignment">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <p class={styles.cardText}>Selected: {() => String(value())}</p>
    </div>
  )
}

function FloatButtonPreview() {
  return (
    <div
      style={{
        position: 'relative',
        height: '11rem',
        border: '1px dashed var(--border)',
        'border-radius': 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <FloatButton
        contained
        icon={<Plus aria-hidden />}
        label="New item"
        position="bottom-right"
      />
      <FloatButton
        contained
        icon={<Share2 aria-hidden />}
        position="bottom-left"
        shape="square"
        aria-label="Share"
      />
    </div>
  )
}

function LinkPreview() {
  return (
    <p class={styles.cardText}>
      Read the <Link href="#/components">component index</Link>, open an{' '}
      <Link href="https://example.com" external>
        external reference
      </Link>{' '}
      or see a <Link href="#/components" variant="standalone">standalone link</Link>.
    </p>
  )
}

export const actionsPreviews = {
  button: ButtonPreview,
  'button-group': ButtonGroupPreview,
  'copy-button': CopyButtonPreview,
  'close-button': CloseButtonPreview,
  toggle: TogglePreview,
  'toggle-group': ToggleGroupPreview,
  'float-button': FloatButtonPreview,
  link: LinkPreview,
} satisfies Record<string, () => unknown>
