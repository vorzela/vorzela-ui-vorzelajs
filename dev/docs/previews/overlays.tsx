import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'
import { AlertDialog } from '~/components/ui/alert-dialog.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Drawer } from '~/components/ui/drawer.tsx'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card.tsx'
import { Input } from '~/components/ui/input.tsx'
import { Modal } from '~/components/ui/modal.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover.tsx'
import { Sheet } from '~/components/ui/sheet.tsx'
import { Tooltip } from '~/components/ui/tooltip.tsx'
import { Bell, Info, Settings, Sparkles, Trash2, Users } from '~/components/ui/icons.tsx'
import styles from '../docs.module.scss'

function AlertDialogPreview() {
  const [open, setOpen] = signal(false)
  const [deleted, setDeleted] = signal(false)
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Delete project
        </Button>
        <Show when={deleted}>
          {() => <Badge variant="success">Project deleted</Badge>}
        </Show>
      </div>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        title="Delete project?"
        description="This permanently removes every build, deployment and secret. This cannot be undone."
        cancelText="Keep project"
        actionText="Delete"
        onAction={() => {
          setDeleted(true)
          setOpen(false)
        }}
      />
    </div>
  )
}

function DrawerPreview() {
  const [open, setOpen] = signal(false)
  return (
    <div class={styles.demoStack}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Filters" side="left">
        <div class={styles.demoStack}>
          <Input label="Project" placeholder="acme" />
          <Input label="Region" placeholder="eu-west-1" />
          <Button onClick={() => setOpen(false)}>Apply filters</Button>
        </div>
      </Drawer>
    </div>
  )
}

function HoverCardPreview() {
  return (
    <HoverCard>
      {() => (
        <>
          <HoverCardTrigger>
            <Button variant="ghost" size="sm">
              <Users aria-hidden /> @ada
            </Button>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start">
            <div style={{ display: 'grid', gap: '0.5rem', 'min-width': '14rem' }}>
              <p class={styles.cardTitle}>Ada Lovelace</p>
              <p class={styles.cardText}>Engineering · London</p>
              <div class={styles.demoRow}>
                <Badge variant="soft">Owner</Badge>
                <Badge variant="success">Online</Badge>
              </div>
            </div>
          </HoverCardContent>
        </>
      )}
    </HoverCard>
  )
}

function ModalPreview() {
  const [open, setOpen] = signal(false)
  return (
    <div class={styles.demoStack}>
      <Button size="sm" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite members"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Send invites</Button>
          </>
        }
      >
        <div class={styles.demoStack}>
          <Input label="Email addresses" placeholder="ada@example.com, grace@example.com" />
          <p class={styles.cardText}>
            Focus is trapped while open and restored to the trigger on close.
          </p>
        </div>
      </Modal>
    </div>
  )
}

function PopoverPreview() {
  return (
    <div class={styles.demoRow}>
      <Popover>
        {() => (
          <>
            <PopoverTrigger>
              <Button variant="outline" size="sm">
                <Settings aria-hidden /> Options
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" ariaLabel="Display options">
              <div style={{ display: 'grid', gap: '0.5rem', 'min-width': '13rem' }}>
                <p class={styles.cardTitle}>Display</p>
                <p class={styles.cardText}>Compact rows, 20 per page.</p>
                <Button size="sm" variant="outline">
                  Reset
                </Button>
              </div>
            </PopoverContent>
          </>
        )}
      </Popover>
    </div>
  )
}

function SheetPreview() {
  const [open, setOpen] = signal(false)
  return (
    <div class={styles.demoStack}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="right"
        title="Release v0.2.0"
        description="What changed in this release."
        footer={<Button onClick={() => setOpen(false)}>Close</Button>}
      >
        <div class={styles.demoStack}>
          <p class={styles.cardText}>· Direct DOM bindings</p>
          <p class={styles.cardText}>· Source-owned components</p>
          <p class={styles.cardText}>· Smaller JSX runtime</p>
        </div>
      </Sheet>
    </div>
  )
}

function TooltipPreview() {
  return (
    <div class={styles.demoRow}>
      <Tooltip content="Save changes">
        <Button size="sm">Hover me</Button>
      </Tooltip>
      <Tooltip content="Notifications" placement="bottom">
        <Button size="icon" variant="ghost" aria-label="Notifications">
          <Bell aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip content="Disabled tooltips never show" disabled>
        <Button size="sm" variant="outline">Disabled</Button>
      </Tooltip>
      <Tooltip content={<span>Rich <strong>content</strong></span>} placement="right">
        <Badge variant="soft">
          <Info aria-hidden /> Details
        </Badge>
      </Tooltip>
      <Tooltip content="Delete permanently" placement="top">
        <Button size="icon" variant="destructive" aria-label="Delete">
          <Trash2 aria-hidden />
        </Button>
      </Tooltip>
      <span class={styles.cardText}>
        <Sparkles aria-hidden /> Tooltips follow the trigger on scroll and resize.
      </span>
    </div>
  )
}

export const overlayPreviews = {
  'alert-dialog': AlertDialogPreview,
  drawer: DrawerPreview,
  'hover-card': HoverCardPreview,
  modal: ModalPreview,
  popover: PopoverPreview,
  sheet: SheetPreview,
  tooltip: TooltipPreview,
} satisfies Record<string, () => unknown>
