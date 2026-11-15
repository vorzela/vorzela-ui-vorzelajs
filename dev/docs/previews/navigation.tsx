import { signal } from '@vorzelajs/core'
import { Accordion } from '~/components/ui/accordion.tsx'
import { ActionMenu } from '~/components/ui/action-menu.tsx'
import { Anchor } from '~/components/ui/anchor.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { Breadcrumb } from '~/components/ui/breadcrumb.tsx'
import { Button } from '~/components/ui/button.tsx'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command.tsx'
import { ContextMenu } from '~/components/ui/context-menu.tsx'
import { Dropdown } from '~/components/ui/dropdown.tsx'
import { Header } from '~/components/ui/header.tsx'
import { Menubar } from '~/components/ui/menubar.tsx'
import { NavIcon } from '~/components/ui/nav-icon.tsx'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '~/components/ui/navigation-menu.tsx'
import { Outline } from '~/components/ui/outline.tsx'
import { Sidebar } from '~/components/ui/sidebar.tsx'
import { Stepper } from '~/components/ui/stepper.tsx'
import { TabBar } from '~/components/ui/tab-bar.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs.tsx'
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '~/components/ui/toolbar.tsx'
import { Topbar } from '~/components/ui/topbar.tsx'
import {
  Bell,
  Bold,
  BarChart3,
  Copy,
  FileText,
  FolderOpen,
  Home,
  Italic,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  Code2,
  Users,
} from '~/components/ui/icons.tsx'
import styles from '../docs.module.scss'

function AccordionPreview() {
  return (
    <Accordion
      type="multiple"
      defaultValue={['signals']}
      items={[
        {
          id: 'signals',
          title: 'How do signals work?',
          content: (
            <p class={styles.cardText}>
              A signal is a getter/setter pair. Reading it inside an effect or a
              DOM binding registers a dependency; writing it schedules only the
              bindings that read it.
            </p>
          ),
        },
        {
          id: 'ownership',
          title: 'Who disposes effects?',
          content: (
            <p class={styles.cardText}>
              Every effect, list row, branch and root has an owner. Disposing an
              owner runs its cleanups in reverse order.
            </p>
          ),
        },
        {
          id: 'ssr',
          title: 'Does it server-render?',
          content: (
            <p class={styles.cardText}>
              Yes. <code>renderToString</code> escapes text and attributes and
              emits island payloads as data only.
            </p>
          ),
        },
      ]}
    />
  )
}

function ActionMenuPreview() {
  const [last, setLast] = signal('Nothing selected')
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <ActionMenu
          triggerLabel="Project actions"
          items={[
            {
              key: 'open',
              label: 'Open project',
              icon: <FolderOpen aria-hidden />,
              onSelect: () => setLast('Open project'),
            },
            {
              key: 'edit',
              label: 'Rename',
              icon: <Pencil aria-hidden />,
              trailing: <kbd class={styles.chip}>R</kbd>,
              onSelect: () => setLast('Rename'),
            },
            {
              key: 'share',
              label: 'Share',
              icon: <Share2 aria-hidden />,
              sectionLabel: 'Collaboration',
              onSelect: () => setLast('Share'),
            },
            {
              key: 'delete',
              label: 'Delete project',
              icon: <Trash2 aria-hidden />,
              danger: true,
              divider: true,
              onSelect: () => setLast('Delete project'),
            },
          ]}
        />
        <ActionMenu
          trigger={<Button size="sm" variant="outline">Custom trigger</Button>}
          items={[
            { key: 'a', label: 'Duplicate', icon: <Copy aria-hidden /> },
            { key: 'b', label: 'Archive', icon: <FolderOpen aria-hidden /> },
          ]}
        />
        <span class={styles.cardText}>{() => last()}</span>
      </div>
    </div>
  )
}

function AnchorPreview() {
  const [active, setActive] = signal('overview')
  return (
    <div style={{ display: 'grid', 'grid-template-columns': '12rem 1fr', gap: '1.5rem' }}>
      <Anchor
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'install', label: 'Install', level: 3 },
          { id: 'usage', label: 'Usage', level: 3 },
          { id: 'api', label: 'API reference' },
        ]}
        activeId="signals"
        onChange={setActive}
      />
      <div class={styles.demoStack}>
        <h3 id="overview" class={styles.cardTitle}>Overview</h3>
        <p class={styles.cardText}>Anchor tracks the active section and scrolls smoothly.</p>
        <h4 id="install" class={styles.cardTitle}>Install</h4>
        <p class={styles.cardText}>Active section: {() => active()}</p>
      </div>
    </div>
  )
}

function BreadcrumbPreview() {
  return (
    <div class={styles.demoStack}>
      <Breadcrumb
        items={[
          { label: 'Projects', href: '#/components' },
          { label: 'Vorzela UI', href: '#/components' },
          { label: 'Components', current: true },
        ]}
      />
      <Breadcrumb
        separator="/"
        items={[
          { label: 'Settings', href: '#/components' },
          { label: 'Members', current: true },
        ]}
      />
    </div>
  )
}

function CommandPreview() {
  const [value, setValue] = signal('')
  return (
    <Command>
      {() => (
        <>
          <CommandInput
            placeholder="Type a command or search…"
            onInput={(event) => setValue((event.target as HTMLInputElement).value)}
          />
          <CommandList>
            <CommandEmpty>No results for “{() => value()}”.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => setValue('Components')}>
                <LayoutDashboard aria-hidden /> Components
              </CommandItem>
              <CommandItem onSelect={() => setValue('Charts')}>
                <BarChart3 aria-hidden /> Charts
              </CommandItem>
              <CommandItem onSelect={() => setValue('Settings')}>
                <Settings aria-hidden /> Settings
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => setValue('New project')}>
                <Plus aria-hidden /> New project
              </CommandItem>
              <CommandItem onSelect={() => setValue('Invite member')}>
                <Users aria-hidden /> Invite member
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </>
      )}
    </Command>
  )
}

function ContextMenuPreview() {
  const [last, setLast] = signal('Right-click the panel')
  return (
    <ContextMenu
      items={[
        { key: 'copy', label: 'Copy', icon: <Copy aria-hidden />, onSelect: () => setLast('Copy') },
        { key: 'paste', label: 'Paste', icon: <FileText aria-hidden />, onSelect: () => setLast('Paste') },
        { key: 'rename', label: 'Rename', icon: <Pencil aria-hidden />, divider: true, onSelect: () => setLast('Rename') },
        { key: 'delete', label: 'Delete', icon: <Trash2 aria-hidden />, danger: true, onSelect: () => setLast('Delete') },
      ]}
    >
      <div
        class={styles.swatch}
        style={{ 'min-height': '8rem', display: 'grid', 'place-items': 'center' }}
      >
        <div class={styles.swatchLabel}>{() => last()}</div>
      </div>
    </ContextMenu>
  )
}

function DropdownPreview() {
  return (
    <div class={styles.demoRow}>
      <Dropdown
        trigger={<Button variant="outline">Open menu</Button>}
        items={[
          { key: 'profile', label: 'Profile', icon: <Users aria-hidden /> },
          { key: 'settings', label: 'Settings', icon: <Settings aria-hidden /> },
          { key: 'signout', label: 'Sign out', divider: true, danger: true },
        ]}
      />
      <Dropdown
        align="right"
        trigger={
          <Button size="icon" variant="ghost" aria-label="More">
            <MoreHorizontal aria-hidden />
          </Button>
        }
        items={[
          { key: 'a', label: 'Duplicate', icon: <Copy aria-hidden /> },
          { key: 'b', label: 'Archive', icon: <FolderOpen aria-hidden /> },
        ]}
      />
    </div>
  )
}

function MenubarPreview() {
  return (
    <Menubar
      menus={[
        {
          label: 'File',
          items: [
            { key: 'new', label: 'New project', icon: <Plus aria-hidden /> },
            { key: 'open', label: 'Open…', icon: <FolderOpen aria-hidden /> },
            { key: 'save', label: 'Save', divider: true },
          ],
        },
        {
          label: 'Edit',
          items: [
            { key: 'undo', label: 'Undo' },
            { key: 'redo', label: 'Redo' },
            { key: 'delete', label: 'Delete', danger: true, divider: true },
          ],
        },
        {
          label: 'View',
          items: [
            { key: 'grid', label: 'Grid' },
            { key: 'list', label: 'List' },
          ],
        },
      ]}
    />
  )
}

function NavIconPreview() {
  return (
    <div class={styles.demoRow}>
      <NavIcon icon={<Home aria-hidden />} label="Home" active />
      <NavIcon icon={<LayoutDashboard aria-hidden />} label="Projects" />
      <NavIcon icon={<BarChart3 aria-hidden />} label="Insights" />
      <NavIcon icon={<Users aria-hidden />} label="Members" />
      <NavIcon icon={<Bell aria-hidden />} label="Alerts" />
    </div>
  )
}

function NavigationMenuPreview() {
  return (
    <NavigationMenu aria-label="Product">
      {() => (
        <NavigationMenuList>
          <NavigationMenuItem value="product">
            <NavigationMenuTrigger>Product</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul style={{ display: 'grid', gap: '0.5rem', 'min-width': '15rem' }}>
                <li>
                  <NavigationMenuLink href="#/components">Components</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#/components/bar-chart">Charts</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="resources">
            <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul style={{ display: 'grid', gap: '0.5rem', 'min-width': '15rem' }}>
                <li>
                  <NavigationMenuLink href="#/components">Docs</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#/components">Changelog</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#/components">Pricing</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      )}
    </NavigationMenu>
  )
}

function OutlinePreview() {
  return (
    <div style={{ display: 'grid', 'grid-template-columns': '1fr 12rem', gap: '1.5rem' }}>
      <div class={styles.demoStack}>
        <p class={styles.cardText}>The outline mirrors the document headings.</p>
        <p class={styles.cardText}>Active: signals</p>
      </div>
      <Outline
        activeId="signals"
        items={[
          { id: 'signals', label: 'Signals', level: 2 },
          { id: 'effects', label: 'Effects', level: 2 },
          { id: 'batching', label: 'Batching', level: 3 },
          { id: 'ownership', label: 'Ownership', level: 2 },
        ]}
      />
    </div>
  )
}

export function SidebarPreview() {
  return (
    <div
      style={{
        height: '30rem',
        overflow: 'hidden',
      }}
      onClick={(event) => {
        if ((event.target as Element).closest('a')) event.preventDefault()
      }}
    >
      <Sidebar
        contained
        brand="Vorzela"
        brandMark="V"
        subtitle="Workspace"
        version="0.2.0"
        currentPath="#/layout"
        groups={[
          {
            group: 'Workspace',
            collapsible: true,
            items: [
              { label: 'Overview', href: '#/overview', icon: <Home aria-hidden /> },
              {
                label: 'Projects',
                icon: <FolderOpen aria-hidden />,
                children: [
                  { label: 'All projects', href: '#/layout' },
                  { label: 'Archived', href: '#/layout/archived' },
                ],
              },
              { label: 'Members', href: '#/layout/members', icon: <Users aria-hidden /> },
            ],
          },
          {
            group: 'Insights',
            collapsible: true,
            items: [
              { label: 'Activity', href: '#/layout/activity', icon: <BarChart3 aria-hidden /> },
              { label: 'Reports', href: '#/layout/reports', icon: <BarChart3 aria-hidden /> },
            ],
          },
          {
            group: 'Settings',
            collapsible: true,
            defaultOpen: false,
            items: [
              { label: 'Preferences', href: '#/layout/settings', icon: <Settings aria-hidden /> },
            ],
          },
        ]}
      />
    </div>
  )
}

function StepperPreview() {
  const [step, setStep] = signal(1)
  return (
    <div class={styles.demoStack}>
      <Stepper
        current={step()}
        onStepChange={setStep}
        steps={[
          { id: 'account', label: 'Account', description: 'Email and password' },
          { id: 'workspace', label: 'Workspace', description: 'Name and region' },
          { id: 'invite', label: 'Invite', description: 'Optional', optional: true },
          { id: 'done', label: 'Done' },
        ]}
      />
      <div class={styles.demoRow}>
        <Button size="sm" variant="outline" onClick={() => setStep((value) => Math.max(0, value - 1))}>
          Back
        </Button>
        <Button size="sm" onClick={() => setStep((value) => Math.min(3, value + 1))}>
          Next
        </Button>
      </div>
    </div>
  )
}

function TabBarPreview() {
  const [value, setValue] = signal('home')
  return (
    <div
      style={{
        'max-width': '24rem',
        border: '1px solid var(--border)',
        'border-radius': 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '1.5rem 1rem', 'min-height': '6rem' }}>
        <p class={styles.cardText}>Selected tab: {() => value()}</p>
      </div>
      <TabBar
        value={value}
        onChange={setValue}
        items={[
          { value: 'home', label: 'Home', icon: <Home aria-hidden /> },
          { value: 'charts', label: 'Charts', icon: <BarChart3 aria-hidden /> },
          { value: 'alerts', label: 'Alerts', icon: <Bell aria-hidden />, badge: 3 },
          { value: 'profile', label: 'Profile', icon: <Users aria-hidden /> },
        ]}
      />
    </div>
  )
}

function TabsPreview() {
  const [value, setValue] = signal('preview')
  return (
    <Tabs value={value} onValueChange={setValue}>
      {() => (
        <>
          <TabsList aria-label="Component view">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <p class={styles.cardText}>Rendered in the real DOM. No virtual tree.</p>
          </TabsContent>
          <TabsContent value="code">
            <p class={styles.cardText}>Copy the module next to the component you own.</p>
          </TabsContent>
          <TabsContent value="api">
            <p class={styles.cardText}>Signals in, accessors bound where the DOM updates.</p>
          </TabsContent>
        </>
      )}
    </Tabs>
  )
}

function ToolbarPreview() {
  return (
    <Toolbar label="Formatting">
      <ToolbarGroup>
        <Button size="icon" variant="ghost" aria-label="Bold">
          <Bold aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Italic">
          <Italic aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Code">
          <Code2 aria-hidden />
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <Button size="sm" variant="outline">
          <Plus aria-hidden /> Insert
        </Button>
        <Button size="sm" variant="ghost">
          <Search aria-hidden /> Find
        </Button>
      </ToolbarGroup>
    </Toolbar>
  )
}

export function HeaderPreview() {
  return (
    <div style={{ border: '1px solid var(--border)', 'border-radius': 'var(--radius-lg)', overflow: 'hidden' }}>
      <Header
        title="Components"
        description="140 source-owned primitives"
        onMenuClick={() => {}}
        actions={
          <>
            <Button size="sm" variant="ghost">
              <Search aria-hidden />
            </Button>
            <Button size="sm">
              <Plus aria-hidden /> New
            </Button>
          </>
        }
      />
    </div>
  )
}

export function TopbarPreview() {
  return (
    <div style={{ border: '1px solid var(--border)', 'border-radius': 'var(--radius-lg)', overflow: 'hidden' }}>
      <Topbar
        title="Overview"
        onMenuClick={() => {}}
        actions={
          <Badge variant="soft">
            <span class={styles.chipDot} /> Live
          </Badge>
        }
      />
    </div>
  )
}

export const navigationPreviews = {
  accordion: AccordionPreview,
  'action-menu': ActionMenuPreview,
  anchor: AnchorPreview,
  breadcrumb: BreadcrumbPreview,
  command: CommandPreview,
  'context-menu': ContextMenuPreview,
  dropdown: DropdownPreview,
  menubar: MenubarPreview,
  'nav-icon': NavIconPreview,
  'navigation-menu': NavigationMenuPreview,
  outline: OutlinePreview,
  stepper: StepperPreview,
  'tab-bar': TabBarPreview,
  tabs: TabsPreview,
  toolbar: ToolbarPreview,
} satisfies Record<string, () => unknown>
