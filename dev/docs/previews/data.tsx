import { signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { Avatar, AvatarFallback, AvatarImage, initials } from '~/components/ui/avatar.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { Blockquote } from '~/components/ui/blockquote.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Chat } from '~/components/ui/chat.tsx'
import { Citation } from '~/components/ui/citation.tsx'
import { CodeBlock as SourceBlock } from '~/components/ui/code-block.tsx'
import { DataTable } from '~/components/ui/data-table.tsx'
import { DescriptionItem, DescriptionList } from '~/components/ui/description-list.tsx'
import { DiffViewer } from '~/components/ui/diff-viewer.tsx'
import { Invoice } from '~/components/ui/invoice.tsx'
import { JsonViewer } from '~/components/ui/json-viewer.tsx'
import { Kbd } from '~/components/ui/kbd.tsx'
import { Lightbox } from '~/components/ui/lightbox.tsx'
import { List, ListItem } from '~/components/ui/list.tsx'
import { Markdown } from '~/components/ui/markdown.tsx'
import { NumberTicker } from '~/components/ui/number-ticker.tsx'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '~/components/ui/pagination.tsx'
import { QRCode } from '~/components/ui/qr-code.tsx'
import { Receipt } from '~/components/ui/receipt.tsx'
import { SimpleDataTable } from '~/components/ui/simple-data-table.tsx'
import { Stat, StatGroup } from '~/components/ui/stat.tsx'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '~/components/ui/table.tsx'
import { Timeline, TimelineDescription, TimelineItem, TimelineTime, TimelineTitle } from '~/components/ui/timeline.tsx'
import { TreeView } from '~/components/ui/tree-view.tsx'
import { Code, Heading, Highlight } from '~/components/ui/typography.tsx'
import { VirtualList } from '~/components/ui/virtual-list.tsx'
import { Bell, Code2, FileText, ShieldCheck, Sparkles, Star, Users, Zap } from '~/components/ui/icons.tsx'
import type { AppColumnDef } from '~/lib/table.ts'
import styles from '../docs.module.scss'

function BadgePreview() {
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Badge>New</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="soft">Beta</Badge>
        <Badge variant="success">Active</Badge>
        <Badge variant="destructive">Failed</Badge>
      </div>
      <div class={styles.demoRow}>
        <Badge size="sm">Small</Badge>
        <Badge size="md">Medium</Badge>
        <Badge size="lg">Large</Badge>
      </div>
    </div>
  )
}

function AvatarPreview() {
  return (
    <div class={styles.demoRow}>
      <Avatar presence="online">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg" square presence="busy">
        <AvatarImage
          src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%233b82f6'/%3E%3C/svg%3E"
          alt=""
        />
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
      <Avatar size="xl" presence="away">
        <AvatarFallback>{initials('Grace Hopper')}</AvatarFallback>
      </Avatar>
      <Avatar size="sm" presence="offline">
        <AvatarFallback>{initials('Alan Turing')}</AvatarFallback>
      </Avatar>
      <Avatar size="xs">
        <AvatarFallback>+9</AvatarFallback>
      </Avatar>
    </div>
  )
}

function KbdPreview() {
  return (
    <div class={styles.demoStack}>
      <div class={styles.kbdRow}>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <span class={styles.cardText}>Opens the command palette.</span>
      </div>
      <div class={styles.kbdRow}>
        <Kbd size="sm">Esc</Kbd>
        <Kbd size="sm">Enter</Kbd>
        <Kbd size="sm">Shift</Kbd>
      </div>
    </div>
  )
}

function StatPreview() {
  return (
    <StatGroup>
      <Stat label="Build minutes" value="12,480" delta="12.4%" trend="up" hint="vs. last month" icon={<Zap aria-hidden />} />
      <Stat label="p95 latency" value="184 ms" delta="8 ms" trend="down" invertTrend hint="Lower is better" />
      <Stat label="Members" value={<NumberTicker value={2481} />} delta="0%" trend="flat" icon={<Users aria-hidden />} />
    </StatGroup>
  )
}

function DescriptionListPreview() {
  return (
    <DescriptionList columns={2}>
      <DescriptionItem term="Project">Vorzela UI</DescriptionItem>
      <DescriptionItem term="Owner">Ada Lovelace</DescriptionItem>
      <DescriptionItem term="Runtime">@vorzelajs/dom 0.0.21</DescriptionItem>
      <DescriptionItem term="Deployed">15 Nov 2026, 09:12 UTC</DescriptionItem>
      <DescriptionItem term="Commit">
        <Code>4f1c2ab</Code>
      </DescriptionItem>
      <DescriptionItem term="Status">
        <Badge variant="success">Healthy</Badge>
      </DescriptionItem>
    </DescriptionList>
  )
}

function TimelinePreview() {
  return (
    <Timeline>
      <TimelineItem status="done" tone="success" date="09:12" dateTime="2026-11-15T09:12">
        <TimelineTitle>Build finished</TimelineTitle>
        <TimelineDescription>All 214 tests passed in 38s.</TimelineDescription>
        <TimelineTime datetime="2026-11-15T09:12">09:12 UTC</TimelineTime>
      </TimelineItem>
      <TimelineItem status="done" tone="success" date="09:14" dateTime="2026-11-15T09:14">
        <TimelineTitle>Deployed to staging</TimelineTitle>
        <TimelineDescription>Health checks passed on all three nodes.</TimelineDescription>
      </TimelineItem>
      <TimelineItem status="active" tone="active" date="09:16" dateTime="2026-11-15T09:16" indicator={<Sparkles aria-hidden />}>
        <TimelineTitle>Awaiting approval</TimelineTitle>
        <TimelineDescription>Two reviewers are required before production.</TimelineDescription>
      </TimelineItem>
      <TimelineItem status="muted" tone="muted" date="—">
        <TimelineTitle>Production rollout</TimelineTitle>
        <TimelineDescription>Queued behind the current release window.</TimelineDescription>
      </TimelineItem>
    </Timeline>
  )
}

function TreeViewPreview() {
  const [selected, setSelected] = signal('button')
  return (
    <div class={styles.demoField}>
      <TreeView
        label="Source tree"
        selectedId={selected}
        onSelect={(node) => setSelected(node.id)}
        defaultExpanded={['ui', 'forms']}
        nodes={[
          {
            id: 'ui',
            label: 'components/ui',
            icon: <FileText aria-hidden />,
            children: [
              { id: 'button', label: 'button.tsx' },
              { id: 'card', label: 'card.tsx' },
              {
                id: 'forms',
                label: 'forms',
                children: [
                  { id: 'input', label: 'input.tsx' },
                  { id: 'select', label: 'select.tsx' },
                ],
              },
            ],
          },
          {
            id: 'charts',
            label: 'charts',
            children: [{ id: 'line', label: 'line-chart.tsx' }],
          },
        ]}
      />
      <p class={styles.cardText}>Selected: {() => selected()}</p>
    </div>
  )
}

function JsonViewerPreview() {
  return (
    <JsonViewer
      label="Island payload"
      defaultExpandDepth={2}
      data={{
        island: 'Counter',
        props: { start: 3, step: 1 },
        meta: { version: '0.0.21', hydrated: true },
        tags: ['signals', 'no-vdom'],
      }}
    />
  )
}

function DiffViewerPreview() {
  const [version, setVersion] = signal(1)
  return (
    <div class={styles.demoStack}>
      <DiffViewer
        label="button.tsx"
        oldValue={'<Button variant="primary">\n  Continue\n</Button>'}
        newValue={() =>
          version() === 1
            ? '<Button variant="secondary" size="sm">\n  Continue\n</Button>'
            : '<Button variant="secondary" size="sm">\n  Continue\n</Button>\n<Button variant="ghost">Cancel</Button>'
        }
      />
      <Button size="sm" variant="outline" onClick={() => setVersion((value) => (value === 1 ? 2 : 1))}>
        Toggle revision
      </Button>
    </div>
  )
}

interface Member {
  id: string
  name: string
  role: string
  builds: number
  status: string
}

const members: Member[] = [
  { id: '1', name: 'Ada Lovelace', role: 'Owner', builds: 128, status: 'Active' },
  { id: '2', name: 'Grace Hopper', role: 'Editor', builds: 94, status: 'Active' },
  { id: '3', name: 'Alan Turing', role: 'Editor', builds: 61, status: 'Invited' },
  { id: '4', name: 'Katherine Johnson', role: 'Viewer', builds: 12, status: 'Active' },
  { id: '5', name: 'Edsger Dijkstra', role: 'Viewer', builds: 4, status: 'Suspended' },
]

const memberColumns: AppColumnDef<Member, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'builds', header: 'Builds' },
  { accessorKey: 'status', header: 'Status' },
]

function TablePreview() {
  return (
    <Table>
      <TableCaption>Members with at least one build this month.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Builds</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.slice(0, 4).map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.name}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell>{member.builds}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell>{members.reduce((sum, member) => sum + member.builds, 0)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

function SimpleDataTablePreview() {
  return (
    <SimpleDataTable
      data={members}
      columns={memberColumns}
      searchable
      searchPlaceholder="Search members…"
      variant="comfortable"
      pagination
      initialPageSize={3}
    />
  )
}

function DataTablePreview() {
  return (
    <DataTable
      data={members}
      columns={memberColumns}
      searchable
      columnVisibilityToggle
      enableRowSelection
      pagination
      initialPageSize={4}
      bulkActions={(selected) => (
        <Button size="sm" variant="outline">
          Email {selected.length} selected
        </Button>
      )}
    />
  )
}

function PaginationPreview() {
  const [page, setPage] = signal(2)
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page() === 1}
          />
        </PaginationItem>
        <For each={() => [1, 2, 3, 4, 5]} key={(item) => item}>
          {(item) => (
            <PaginationItem>
              <PaginationLink
                isActive={page() === item}
                onClick={() => setPage(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )}
        </For>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => setPage((value) => Math.min(5, value + 1))}
            disabled={page() === 5}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function ReceiptPreview() {
  return (
    <div style={{ 'max-width': '22rem' }}>
      <Receipt
        title="Vorzela Cloud"
        subtitle="Receipt #1042"
        items={[
          { label: 'Pro plan', qty: 1, amount: 24, meta: 'Monthly' },
          { label: 'Extra seats', qty: 3, amount: 18, meta: '$6 each' },
          { label: 'Build minutes', qty: 200, amount: 4 },
        ]}
        subtotal={46}
        tax={4.6}
        tip={5}
        total={55.6}
        currency="USD"
        footer={<span class={styles.cardText}>Paid with card ending 4242.</span>}
      />
    </div>
  )
}

function InvoicePreview() {
  return (
    <Invoice
      number="INV-2026-014"
      status="due"
      issuedAt="2026-11-01"
      dueAt="2026-11-30"
      from={{ name: 'Vorzela Labs', lines: ['12 Signal Street', 'Nairobi, KE'] }}
      to={{ name: 'Northwind Commerce', lines: ['Accounts payable', 'Berlin, DE'] }}
      items={[
        { description: 'Design system retainer', quantity: 1, unitPrice: 4800 },
        { description: 'Component audit', quantity: 3, unitPrice: 450 },
        { description: 'Onboarding workshop', quantity: 1, unitPrice: 1200 },
      ]}
      taxRate={0.16}
      currency="USD"
      notes="Payment is due within 30 days. Late payments accrue 2% monthly."
    />
  )
}

function ListPreview() {
  return (
    <List>
      <ListItem
        icon={<Zap aria-hidden />}
        title="Production"
        description="Deployed 4 minutes ago"
        trailing={<Badge variant="success">Live</Badge>}
      />
      <ListItem
        icon={<Code2 aria-hidden />}
        title="Preview"
        description="Branch feature/signals"
        trailing={<Badge variant="soft">Building</Badge>}
      />
      <ListItem
        icon={<Bell aria-hidden />}
        title="Alerts"
        description="Three channels configured"
        trailing={<Kbd size="sm">⌘A</Kbd>}
        href="#/components/list"
      />
    </List>
  )
}

function CitationPreview() {
  return (
    <p class={styles.cardText}>
      Signals track their own dependencies, so there are no dependency arrays to
      maintain <Citation index={1} source="VorzelaJS docs · Signals" href="#/components" />.
      Fine-grained bindings update the DOM directly{' '}
      <Citation index={2} source="Architecture notes" />.
    </p>
  )
}

function BlockquotePreview() {
  return (
    <div class={styles.demoStack}>
      <Blockquote cite="Ada Lovelace">
        The engine weaves algebraic patterns just as the Jacquard loom weaves
        flowers and leaves.
      </Blockquote>
      <Blockquote tone="accent" cite="Grace Hopper">
        The most dangerous phrase in the language is: we've always done it this
        way.
      </Blockquote>
    </div>
  )
}

function CodeBlockPreview() {
  return (
    <SourceBlock
      title="counter.tsx"
      language="tsx"
      code={`import { signal } from '@vorzelajs/core'

export function Counter() {
  const [count, setCount] = signal(0)

  return (
    <button onClick={() => setCount((n) => n + 1)}>
      Count: {count()}
    </button>
  )
}`}
    />
  )
}

function MarkdownPreview() {
  return (
    <Markdown
      source={`## Fine-grained updates

A **signal** is the only state primitive. Bind an accessor where the DOM
should change; the component body runs once.

- No virtual DOM
- No dependency arrays
- Escaped by default

> Raw HTML requires an explicit sanitizer.

\`\`\`ts
const [count, setCount] = signal(0)
\`\`\`

Read the [architecture notes](#/components) for the full model.`}
    />
  )
}

function TypographyPreview() {
  return (
    <div class={styles.demoStack}>
      <Heading as="h3" size="xl">Extra large heading</Heading>
      <Heading as="h4" size="lg">Large heading</Heading>
      <Heading as="h5" size="md">Medium heading</Heading>
      <p class={styles.cardText}>
        Inline <Code>signal(0)</Code> and a{' '}
        <Highlight>highlighted match</Highlight> inside body copy.
      </p>
    </div>
  )
}

function NumberTickerPreview() {
  const [value, setValue] = signal(1280)
  return (
    <div class={styles.demoStack}>
      <p class={styles.statValue}>
        <NumberTicker value={value} suffix=" builds" />
      </p>
      <div class={styles.demoRow}>
        <Button size="sm" variant="outline" onClick={() => setValue((current) => current + 240)}>
          +240
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setValue(0)}>
          Reset
        </Button>
      </div>
    </div>
  )
}

function ChatPreview() {
  return (
    <Chat
      messages={[
        {
          id: '1',
          role: 'assistant',
          name: 'Vorzela',
          time: '09:12',
          content: 'Your preview build is ready. Want me to open the component index?',
        },
        {
          id: '2',
          role: 'user',
          name: 'Ada',
          time: '09:13',
          content: 'Yes — and show the new charts too.',
        },
        {
          id: '3',
          role: 'assistant',
          name: 'Vorzela',
          time: '09:13',
          content: 'Opened 140 components, including 18 charts.',
        },
        {
          id: '4',
          role: 'system',
          content: 'Conversation marked as resolved.',
        },
      ]}
    />
  )
}

function QRCodePreview() {
  return (
    <div class={styles.demoRow}>
      <QRCode value="https://vorzela.dev/ui" size={160} title="Scan to open the docs" caption="vorzela.dev/ui" />
      <QRCode value="vorzelajs-ui add button" size={120} level="H" color="hsl(var(--primary))" />
    </div>
  )
}

function VirtualListPreview() {
  return (
    <VirtualList
      items={() => Array.from({ length: 5000 }, (_, index) => index + 1)}
      itemHeight={32}
      height={240}
      getKey={(item) => item}
      label="5,000 rows"
      renderItem={(item) => (
        <div
          style={{
            height: '32px',
            display: 'flex',
            'align-items': 'center',
            padding: '0 0.75rem',
            'border-bottom': '1px solid var(--border)',
          }}
        >
          Row {item}
        </div>
      )}
    />
  )
}

function IconPreview() {
  return (
    <div class={styles.demoRow}>
      <Star size={24} aria-hidden />
      <Sparkles size={24} aria-hidden />
      <Zap size={24} aria-hidden />
      <ShieldCheck size={24} aria-hidden />
      <Bell size={24} aria-hidden />
      <Code2 size={24} aria-hidden />
    </div>
  )
}

function LightboxPreview() {
  const [open, setOpen] = signal(false)
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Open lightbox
        </Button>
        <span class={styles.cardText}>Esc closes the overlay.</span>
      </div>
      <Show when={open}>
        {() => (
          <Lightbox
            open={open}
            src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='800' height='500' fill='%23111827'/%3E%3Ccircle cx='400' cy='250' r='140' fill='%233b82f6'/%3E%3C/svg%3E"
            alt="Abstract blue circle on a dark background"
            caption="A zoomable image overlay"
            onClose={() => setOpen(false)}
          />
        )}
      </Show>
    </div>
  )
}

export const dataPreviews = {
  badge: BadgePreview,
  avatar: AvatarPreview,
  kbd: KbdPreview,
  stat: StatPreview,
  'description-list': DescriptionListPreview,
  timeline: TimelinePreview,
  'tree-view': TreeViewPreview,
  'json-viewer': JsonViewerPreview,
  'diff-viewer': DiffViewerPreview,
  table: TablePreview,
  'simple-data-table': SimpleDataTablePreview,
  'data-table': DataTablePreview,
  pagination: PaginationPreview,
  receipt: ReceiptPreview,
  invoice: InvoicePreview,
  list: ListPreview,
  citation: CitationPreview,
  blockquote: BlockquotePreview,
  'code-block': CodeBlockPreview,
  markdown: MarkdownPreview,
  typography: TypographyPreview,
  'number-ticker': NumberTickerPreview,
  chat: ChatPreview,
  'qr-code': QRCodePreview,
  'virtual-list': VirtualListPreview,
  icon: IconPreview,
  lightbox: LightboxPreview,
} satisfies Record<string, () => unknown>
