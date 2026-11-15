import type { PropRow } from './showcase.tsx'

export type ComponentGroup =
  | 'Actions'
  | 'Forms'
  | 'Feedback'
  | 'Data display'
  | 'Surfaces'
  | 'Layout'
  | 'Navigation'
  | 'Overlays'
  | 'Media'
  | 'Charts'

export interface ComponentDoc {
  slug: string
  name: string
  group: ComponentGroup
  description: string
  /** Import path a consumer gets after `vorzelajs-ui add`. */
  module: string
  imports: string
  code: string
  props: PropRow[]
  /** Added with the Astryx-inspired content and overlay release. */
  isNew?: boolean
}

export const componentGroups: ComponentGroup[] = [
  'Actions',
  'Forms',
  'Feedback',
  'Data display',
  'Surfaces',
  'Layout',
  'Navigation',
  'Overlays',
  'Media',
  'Charts',
]

interface Entry {
  slug: string
  name: string
  imports: string
  description: string
  snippet: string
  module?: string
  props?: PropRow[]
  isNew?: boolean
}

const ui = (slug: string): string => `~/components/ui/${slug}`
const chart = (slug: string): string => `~/charts/${slug}`

function build(entries: Entry[], group: ComponentGroup): ComponentDoc[] {
  return entries.map((entry) => {
    const module = entry.module ?? (group === 'Charts' ? chart(entry.slug) : ui(entry.slug))
    return {
      slug: entry.slug,
      name: entry.name,
      group,
      description: entry.description,
      module,
      imports: entry.imports,
      code: `import { ${entry.imports} } from '${module}'\n\n${entry.snippet}`,
      props: entry.props ?? [],
      isNew: entry.isNew ?? false,
    }
  })
}

const actions: Entry[] = [
  {
    slug: 'button',
    name: 'Button',
    imports: 'Button',
    description:
      'One flat control with six tones and four sizes. The primary tone carries the single accent; everything else stays neutral.',
    snippet: `<Button>Continue</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline" size="sm">Small</Button>
<Button variant="destructive">
  <Trash2 aria-hidden />
  Delete
</Button>`,
    props: [
      { name: 'variant', type: 'primary | secondary | outline | ghost | destructive | link', defaultValue: 'primary', description: 'Visual tone. Use one primary action per view.' },
      { name: 'size', type: 'sm | md | lg | icon', defaultValue: 'md', description: '`icon` is square and expects an accessible label.' },
      { name: 'type', type: 'button | submit | reset', defaultValue: 'button', description: 'Never submits a form by accident.' },
      { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Dims the control and blocks pointer interaction.' },
    ],
  },
  {
    slug: 'button-group',
    name: 'ButtonGroup',
    imports: 'ButtonGroup',
    description: 'Joins related buttons into one segmented rail, horizontally or vertically.',
    snippet: `<ButtonGroup>
  <Button variant="outline">Day</Button>
  <Button variant="outline">Week</Button>
  <Button variant="outline">Month</Button>
</ButtonGroup>`,
  },
  {
    slug: 'copy-button',
    name: 'CopyButton',
    imports: 'CopyButton',
    description: 'Copies a value to the clipboard and confirms with a short check state.',
    snippet: `<CopyButton value="npm run dev" />
<CopyButton value="vorzelajs-ui add button" variant="secondary" />`,
  },
  {
    slug: 'close-button',
    name: 'CloseButton',
    imports: 'CloseButton',
    description: 'A dismiss control with an accessible label, sized for dialogs and banners.',
    snippet: `<CloseButton />
<CloseButton size="lg" label="Dismiss banner" />`,
  },
  {
    slug: 'toggle',
    name: 'Toggle',
    imports: 'Toggle',
    description: 'A pressed/unpressed button for formatting and view switches.',
    snippet: `<Toggle aria-label="Bold" onPressedChange={setPressed}>
  <Bold aria-hidden />
</Toggle>`,
  },
  {
    slug: 'toggle-group',
    name: 'ToggleGroup',
    imports: 'ToggleGroup, ToggleGroupItem',
    description: 'A roving-focus set of toggles that reports the selected value.',
    snippet: `<ToggleGroup value={value} onValueChange={setValue} aria-label="Alignment">
  <ToggleGroupItem value="left">Left</ToggleGroupItem>
  <ToggleGroupItem value="center">Center</ToggleGroupItem>
</ToggleGroup>`,
  },
  {
    slug: 'float-button',
    name: 'FloatButton',
    imports: 'FloatButton',
    description: 'A floating action pinned to a corner of the viewport or a contained frame.',
    snippet: `<FloatButton
  contained
  icon={<Plus aria-hidden />}
  label="New item"
  position="bottom-right"
/>`,
  },
  {
    slug: 'link',
    name: 'Link',
    imports: 'Link',
    description: 'An inline or standalone anchor with external-link handling.',
    snippet: `<Link href="#/components">Component index</Link>
<Link href="https://example.com" external>External reference</Link>`,
  },
  {
    slug: 'action-menu',
    name: 'ActionMenu',
    imports: 'ActionMenu',
    description: 'An overflow menu for row actions, with sections, shortcuts and danger tones.',
    snippet: `<ActionMenu
  triggerLabel="Project actions"
  items={[
    { key: 'open', label: 'Open project', onSelect: open },
    { key: 'delete', label: 'Delete', danger: true, divider: true },
  ]}
/>`,
  },
  {
    slug: 'context-menu',
    name: 'ContextMenu',
    imports: 'ContextMenu',
    description: 'A right-click menu positioned at the pointer and dismissed on outside click.',
    snippet: `<ContextMenu items={items}>
  <div>Right-click this surface</div>
</ContextMenu>`,
  },
  {
    slug: 'dropdown',
    name: 'Dropdown',
    imports: 'Dropdown',
    description: 'A trigger-anchored menu with keyboard navigation and optional alignment.',
    snippet: `<Dropdown
  trigger={<Button variant="outline">Open menu</Button>}
  items={[
    { key: 'profile', label: 'Profile' },
    { key: 'signout', label: 'Sign out', danger: true, divider: true },
  ]}
/>`,
  },
  {
    slug: 'menubar',
    name: 'Menubar',
    imports: 'Menubar',
    description: 'A desktop-style menu bar where sibling menus switch on hover.',
    snippet: `<Menubar menus={[{ label: 'File', items: fileItems }, { label: 'Edit', items: editItems }]} />`,
  },
  {
    slug: 'toolbar',
    name: 'Toolbar',
    imports: 'Toolbar, ToolbarGroup, ToolbarSeparator',
    description: 'A labelled, arrow-key-navigable rail for formatting and bulk actions.',
    snippet: `<Toolbar label="Formatting">
  <ToolbarGroup>
    <Button size="icon" variant="ghost" aria-label="Bold"><Bold /></Button>
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarGroup>
    <Button size="sm">Insert</Button>
  </ToolbarGroup>
</Toolbar>`,
  },
  {
    slug: 'command',
    name: 'Command',
    imports: 'Command, CommandInput, CommandList, CommandItem',
    description: 'A filtered command palette with an active row and keyboard selection.',
    snippet: `<Command>
  {() => (
    <>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandItem onSelect={run}>New project</CommandItem>
      </CommandList>
    </>
  )}
</Command>`,
  },
]

const forms: Entry[] = [
  {
    slug: 'input',
    name: 'Input',
    imports: 'Input',
    description: 'A labelled text field with hint, error and success states plus three appearances.',
    snippet: `<Input label="Email" type="email" placeholder="you@example.com" />
<Input label="Invalid" error="Enter a valid email address." />
<Input label="Filled" appearance="filled" />`,
    props: [
      { name: 'label', type: 'string', description: 'Rendered above the control and wired to it.' },
      { name: 'hint', type: 'ReactNode', description: 'Help text linked with `aria-describedby`.' },
      { name: 'error', type: 'string', description: 'Error message; sets `aria-invalid`.' },
      { name: 'success', type: 'string', description: 'Positive confirmation message.' },
      { name: 'appearance', type: 'default | filled | outlined', defaultValue: 'default', description: 'Surface treatment.' },
    ],
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    imports: 'Textarea',
    description: 'A resizable multiline field with an optional live character count.',
    snippet: `<Textarea label="Release notes" maxLength={160} showCount value={value} onChange={onChange} />`,
  },
  {
    slug: 'label',
    name: 'Label',
    imports: 'Label',
    description: 'A form label with a required marker and an optional hint.',
    snippet: `<Label htmlFor="email" required hint="We only use this for receipts.">Email</Label>`,
  },
  {
    slug: 'field',
    name: 'Field',
    imports: 'Field, FieldGroup',
    description: 'A label/control/message wrapper that keeps ids and descriptions consistent.',
    snippet: `<FieldGroup>
  <Field label="Full name" htmlFor="name" hint="As it appears on invoices.">
    <Input id="name" />
  </Field>
</FieldGroup>`,
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    imports: 'Checkbox',
    description: 'A three-state checkbox with a label, hint and indeterminate support.',
    snippet: `<Checkbox checked={checked} onChange={setChecked} label="Email me updates" />`,
    props: [
      { name: 'checked', type: 'boolean | Accessor<boolean>', description: 'Controlled checked state.' },
      { name: 'onChange', type: '(checked: boolean) => void', description: 'Called with the next state.' },
      { name: 'indeterminate', type: 'boolean', defaultValue: 'false', description: 'Renders the mixed state.' },
    ],
  },
  {
    slug: 'radio-group',
    name: 'RadioGroup',
    imports: 'RadioGroup',
    description: 'A roving radio set with descriptions and keyboard navigation.',
    snippet: `<RadioGroup label="Plan" options={plans} value={value} onChange={setValue} />`,
  },
  {
    slug: 'switch',
    name: 'Switch',
    imports: 'Switch',
    description: 'An immediate on/off control with label, description and reverse layout.',
    snippet: `<Switch checked={checked} onCheckedChange={setChecked} label="Product updates" />`,
  },
  {
    slug: 'select',
    name: 'Select',
    imports: 'Select',
    description: 'A custom listbox with search, groups and filled/outlined appearances.',
    snippet: `<Select label="Plan" options={plans} value={value} onChange={setValue} />`,
    props: [
      { name: 'options', type: 'SelectOption[]', description: 'Value, label, description and optional disabled flag.' },
      { name: 'searchable', type: 'boolean', defaultValue: 'false', description: 'Adds a filter input to the panel.' },
      { name: 'clearable', type: 'boolean', defaultValue: 'false', description: 'Shows a clear affordance for the value.' },
    ],
  },
  {
    slug: 'native-select',
    name: 'NativeSelect',
    imports: 'NativeSelect',
    description: 'A native `<select>` styled to match the kit, for mobile and form fallbacks.',
    snippet: `<NativeSelect label="Region" defaultValue="eu" options={regions} />`,
  },
  {
    slug: 'combobox',
    name: 'Combobox',
    imports: 'Combobox',
    description: 'A searchable single-select with descriptions and a clear button.',
    snippet: `<Combobox label="Workspace" options={workspaces} value={value} onChange={setValue} clearable />`,
  },
  {
    slug: 'autocomplete',
    name: 'Autocomplete',
    imports: 'Autocomplete',
    description: 'A free-text input with a suggestion list driven by your own accessor.',
    snippet: `<Autocomplete
  query={query}
  onQueryChange={setQuery}
  items={items}
  onSelect={setQuery}
  itemLabel={(item) => item}
  itemValue={(item) => item}
/>`,
  },
  {
    slug: 'search-input',
    name: 'SearchInput',
    imports: 'SearchInput',
    description: 'A search field with recent-history suggestions and a submit callback.',
    snippet: `<SearchInput label="Search projects" initialHistory={['charts', 'tables']} onSearch={run} />`,
  },
  {
    slug: 'number-input',
    name: 'NumberInput',
    imports: 'NumberInput',
    description: 'A stepper-backed numeric field with bounds, step and a unit suffix.',
    snippet: `<NumberInput label="Seats" value={value} onChange={setValue} min={1} max={50} suffix="seats" />`,
  },
  {
    slug: 'currency-input',
    name: 'CurrencyInput',
    imports: 'CurrencyInput',
    description: 'A locale-aware money field that keeps a numeric value while formatting the display.',
    snippet: `<CurrencyInput label="Budget" value={value} onChange={setValue} currency="USD" />`,
  },
  {
    slug: 'otp-input',
    name: 'OtpInput',
    imports: 'OtpInput',
    description: 'A fixed-length one-time-code field with paste and arrow-key handling.',
    snippet: `<OtpInput length={6} value={value} onChange={setValue} label="Verification code" />`,
  },
  {
    slug: 'tag-input',
    name: 'TagInput',
    imports: 'TagInput',
    description: 'A token field for labels and recipients with a maximum tag count.',
    snippet: `<TagInput label="Labels" value={tags} onChange={setTags} maxTags={8} />`,
  },
  {
    slug: 'slider',
    name: 'Slider',
    imports: 'Slider',
    description: 'A single-value range input with a filled track and keyboard steps.',
    snippet: `<Slider label="Radius scale" value={value} onChange={setValue} />`,
  },
  {
    slug: 'range-slider',
    name: 'RangeSlider',
    imports: 'RangeSlider',
    description: 'A two-handle range with a constrained lower and upper bound.',
    snippet: `<RangeSlider label="Price range" value={value} onChange={setValue} min={0} max={200} />`,
  },
  {
    slug: 'rating',
    name: 'Rating',
    imports: 'Rating',
    description: 'Star rating with half steps, read-only mode and an optional numeric value.',
    snippet: `<Rating label="Quality" value={value} onChange={setValue} showValue />`,
  },
  {
    slug: 'segmented-control',
    name: 'SegmentedControl',
    imports: 'SegmentedControl',
    description: 'A compact set of mutually exclusive views, sized for toolbars.',
    snippet: `<SegmentedControl label="Density" value={value} onChange={setValue} options={options} />`,
  },
  {
    slug: 'calendar',
    name: 'Calendar',
    imports: 'Calendar',
    description: 'A month grid with keyboard navigation, today marker and a select callback.',
    snippet: `<Calendar value={value} onSelect={setValue} showToday />`,
  },
  {
    slug: 'date-picker',
    name: 'DatePicker',
    imports: 'DatePicker',
    description: 'A text field that opens the calendar and writes an ISO date value.',
    snippet: `<DatePicker label="Launch date" value={value} onChange={setValue} />`,
  },
  {
    slug: 'time-picker',
    name: 'TimePicker',
    imports: 'TimePicker',
    description: 'A 24-hour time field with a scrollable hour and minute panel.',
    snippet: `<TimePicker label="Reminder" value={value} onChange={setValue} />`,
  },
  {
    slug: 'color-picker',
    name: 'ColorPicker',
    imports: 'ColorPicker',
    description: 'A swatch-and-hex field with presets and a native colour input.',
    snippet: `<ColorPicker label="Accent" value={value} onChange={setValue} presets={['#3b82f6', '#10b981']} />`,
  },
  {
    slug: 'editable',
    name: 'Editable',
    imports: 'Editable',
    description: 'Click-to-edit text that commits on Enter and cancels on Escape.',
    snippet: `<Editable label="Project name" defaultValue="Vorzela UI" onSave={save} />`,
  },
  {
    slug: 'mentions',
    name: 'Mentions',
    imports: 'Mentions',
    description: 'A textarea with an `@` suggestion list and keyboard selection.',
    snippet: `<Mentions label="Comment" suggestions={people} onSelect={insert} />`,
  },
  {
    slug: 'cascader',
    name: 'Cascader',
    imports: 'Cascader',
    description: 'A hierarchical select that reports the full path of values.',
    snippet: `<Cascader label="Region" value={value} onChange={setValue} options={regions} />`,
  },
  {
    slug: 'transfer',
    name: 'Transfer',
    imports: 'Transfer',
    description: 'Two lists for moving items between available and selected sets.',
    snippet: `<Transfer
  dataSource={items}
  targetKeys={keys}
  onChange={setKeys}
  titles={['Available', 'Selected']}
  searchable
/>`,
  },
  {
    slug: 'file-picker',
    name: 'FilePicker',
    imports: 'FilePicker',
    description: 'A file input as a dropzone, button or compact row, with type and size limits.',
    snippet: `<FilePicker label="Evidence" variant="dropzone" accept={['image/*', '.pdf']} maxFiles={3} onFiles={onFiles} />`,
  },
  {
    slug: 'file-upload',
    name: 'FileUpload',
    imports: 'FileUpload',
    description: 'A drop area that tracks per-file progress, errors and removal.',
    snippet: `<FileUpload label="Attach evidence" accept={['image/png', '.pdf']} maxFiles={3} onFiles={onFiles} />`,
  },
  {
    slug: 'floating-label-input',
    name: 'FloatingLabelInput',
    imports: 'FloatingLabelInput, FloatingLabelTextarea, FloatingLabelSelect',
    description: 'Fields whose label floats into the border on focus or when a value exists.',
    snippet: `<FloatingLabelInput label="Email address" />
<FloatingLabelTextarea label="Message" rows={3} />
<FloatingLabelSelect label="Plan" defaultValue="pro">…</FloatingLabelSelect>`,
  },
  {
    slug: 'input-group',
    name: 'InputGroup',
    imports: 'InputGroup, InputGroupAddon, InputGroupInput, InputGroupText',
    description: 'An input with leading or trailing addons and static text prefixes.',
    snippet: `<InputGroup>
  <InputGroupAddon><Mail aria-hidden /></InputGroupAddon>
  <InputGroupInput placeholder="you@example.com" aria-label="Email" />
</InputGroup>`,
  },
  {
    slug: 'password-input',
    name: 'PasswordStrengthInput',
    imports: 'PasswordStrengthInput',
    description: 'A password field with a visibility toggle and a live strength meter.',
    snippet: `<PasswordStrengthInput label="Password" value={value} onChange={setValue} />`,
  },
  {
    slug: 'phone-input',
    name: 'PhoneInput',
    imports: 'PhoneInput',
    description: 'A phone field with a country selector and E.164 formatting.',
    snippet: `<PhoneInput label="Phone" value={value} onChange={setValue} />`,
  },
]

const feedback: Entry[] = [
  {
    slug: 'alert',
    name: 'Alert',
    imports: 'Alert',
    description: 'An inline message with four tones and an optional dismiss action.',
    snippet: `<Alert variant="info" title="Heads up">
  The API is read-only on Saturday.
</Alert>`,
  },
  {
    slug: 'banner',
    name: 'Banner',
    imports: 'Banner',
    description: 'A full-width page notice for maintenance, usage and release messages.',
    snippet: `<Banner tone="warning" title="Usage at 82%" dismissible>
  You have used 82% of this month's build minutes.
</Banner>`,
  },
  {
    slug: 'callout',
    name: 'Callout',
    imports: 'Callout',
    description: 'A quiet documentation aside for tips, notes and warnings.',
    snippet: `<Callout tone="tip" title="Copy, don't depend">
  Components are source-owned.
</Callout>`,
  },
  {
    slug: 'progress',
    name: 'Progress',
    imports: 'Progress',
    description: 'A determinate or indeterminate bar with tones and a value readout.',
    snippet: `<Progress label="Upload" value={value} showValue />
<Progress label="Indeterminate" />`,
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    imports: 'Spinner',
    description: 'A size-scaled loading indicator with a screen-reader label.',
    snippet: `<Spinner size="sm" />
<Spinner size="lg" />`,
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    imports: 'Skeleton',
    description: 'Shape-matched placeholders that hold layout while data loads.',
    snippet: `<Skeleton variant="circle" width={44} height={44} />
<Skeleton variant="text" width="60%" />
<Skeleton variant="rect" height={120} />`,
  },
  {
    slug: 'status-dot',
    name: 'StatusDot',
    imports: 'StatusDot',
    description: 'A small coloured dot with a text label and an optional pulse.',
    snippet: `<StatusDot tone="success" label="Live" pulse />`,
  },
  {
    slug: 'empty',
    name: 'Empty',
    imports: 'Empty',
    description: 'A zero-state with an icon, explanation and one primary action.',
    snippet: `<Empty
  icon={<FolderOpen />}
  title="No projects yet"
  description="Create a project to start collecting builds."
  action={{ label: 'New project', onClick: create }}
/>`,
  },
  {
    slug: 'error-state',
    name: 'ErrorState',
    imports: 'ErrorState',
    description: 'A failure panel with a retry action and a stable layout.',
    snippet: `<ErrorState title="Could not load usage" description="The service timed out." onRetry={retry} />`,
  },
  {
    slug: 'result',
    name: 'Result',
    imports: 'Result',
    description: 'A terminal outcome panel for success, info, warning and error flows.',
    snippet: `<Result
  tone="success"
  title="Deployment complete"
  description="v0.2.0 is live in production."
  actions={<Button size="sm">View deployment</Button>}
/>`,
  },
  {
    slug: 'sonner',
    name: 'Toaster',
    imports: 'Toaster, useToast',
    description: 'A queued toast host with success, error, info and action variants.',
    snippet: `const { toast } = useToast()

toast({ type: 'success', title: 'Saved', description: 'Your changes are live.' })

<Toaster position="bottom-right" />`,
  },
  {
    slug: 'network-loader',
    name: 'NetworkLoader',
    imports: 'NetworkLoader, startNetworkLoader, finishNetworkLoader',
    description: 'A top-edge progress bar driven by request start and finish events.',
    snippet: `startNetworkLoader()
// …request…
finishNetworkLoader()

<NetworkLoader showSpinner glow />`,
  },
  {
    slug: 'offline-banner',
    name: 'OfflineBanner',
    imports: 'OfflineBanner',
    description: 'A connection-state banner that retries when the network returns.',
    snippet: `<OfflineBanner onRetry={retry} />`,
  },
  {
    slug: 'cookie-consent',
    name: 'CookieConsent',
    imports: 'CookieConsent',
    description: 'A stored consent bar with accept/reject callbacks and a policy link.',
    snippet: `<CookieConsent
  storageKey="app.consent"
  policyHref="/privacy"
  onAccept={accept}
  onReject={reject}
/>`,
  },
  {
    slug: 'notification-center',
    name: 'NotificationCenter',
    imports: 'NotificationCenter',
    description: 'A bell trigger with an unread count and a dismissible notification panel.',
    snippet: `<NotificationCenter notifications={notifications} onMarkAllRead={markAllRead} />`,
  },
  {
    slug: 'tour',
    name: 'Tour',
    imports: 'Tour',
    description: 'A stepped product tour that highlights live targets and restores focus.',
    snippet: `<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[{ id: 'one', target: '#start', title: 'Start here', description: '…' }]}
  showSkip
/>`,
  },
  {
    slug: 'popconfirm',
    name: 'Popconfirm',
    imports: 'Popconfirm',
    description: 'A small confirmation popover for destructive row actions.',
    snippet: `<Popconfirm title="Delete project?" destructive onConfirm={remove}>
  <Button variant="destructive">Delete</Button>
</Popconfirm>`,
  },
  {
    slug: 'icons',
    name: 'Icons',
    imports: 'Sparkles, CircleCheck, ShieldCheck',
    description: 'Tree-shakeable icon components sized by `1em` and coloured by `currentColor`.',
    snippet: `<Sparkles aria-hidden />
<CircleCheck aria-hidden />
<ShieldCheck size={24} aria-hidden />`,
  },
]

const dataDisplay: Entry[] = [
  {
    slug: 'badge',
    name: 'Badge',
    imports: 'Badge',
    description: 'Compact status or metadata. Soft and outline tones stay quiet; success and destructive are reserved for state.',
    snippet: `<Badge>New</Badge>
<Badge variant="soft">Beta</Badge>
<Badge variant="success">Active</Badge>`,
    props: [
      { name: 'variant', type: 'primary | secondary | outline | destructive | success | soft', defaultValue: 'primary', description: 'Tone of the badge.' },
      { name: 'size', type: 'sm | md | lg', defaultValue: 'md', description: 'Padding and type size.' },
    ],
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    imports: 'Avatar, AvatarImage, AvatarFallback',
    description: 'A circular or square identity mark with a presence dot and initials fallback.',
    snippet: `<Avatar presence="online">
  <AvatarFallback>AL</AvatarFallback>
</Avatar>`,
  },
  {
    slug: 'kbd',
    name: 'Kbd',
    imports: 'Kbd',
    description: 'A keyboard key token for shortcuts and command hints.',
    snippet: `<Kbd>⌘</Kbd> <Kbd>K</Kbd>`,
  },
  {
    slug: 'stat',
    name: 'Stat',
    imports: 'Stat, StatGroup',
    description: 'A metric tile with a delta, trend arrow, hint and optional icon.',
    snippet: `<StatGroup>
  <Stat label="Build minutes" value="12,480" delta="12.4%" trend="up" />
</StatGroup>`,
  },
  {
    slug: 'description-list',
    name: 'DescriptionList',
    imports: 'DescriptionList, DescriptionItem',
    description: 'A term/value grid for metadata, one to three columns.',
    snippet: `<DescriptionList columns={2}>
  <DescriptionItem term="Owner">Ada Lovelace</DescriptionItem>
  <DescriptionItem term="Runtime">0.0.21</DescriptionItem>
</DescriptionList>`,
  },
  {
    slug: 'timeline',
    name: 'Timeline',
    imports: 'Timeline, TimelineItem, TimelineTitle, TimelineDescription',
    description: 'A vertical or horizontal rail of events with status, tone and custom markers.',
    snippet: `<Timeline>
  <TimelineItem status="done" tone="success" date="09:12">
    <TimelineTitle>Build finished</TimelineTitle>
    <TimelineDescription>All tests passed.</TimelineDescription>
  </TimelineItem>
</Timeline>`,
  },
  {
    slug: 'tree-view',
    name: 'TreeView',
    imports: 'TreeView',
    description: 'A nested tree with expansion state and a controlled selection.',
    snippet: `<TreeView nodes={nodes} selectedId={selected} onSelect={(node) => setSelected(node.id)} />`,
  },
  {
    slug: 'json-viewer',
    name: 'JsonViewer',
    imports: 'JsonViewer',
    description: 'A collapsible JSON tree for payloads, props and configuration.',
    snippet: `<JsonViewer label="Island payload" data={payload} defaultExpandDepth={2} />`,
  },
  {
    slug: 'diff-viewer',
    name: 'DiffViewer',
    imports: 'DiffViewer',
    description: 'A side-by-side line diff that accepts live accessors.',
    snippet: `<DiffViewer label="button.tsx" oldValue={before} newValue={after} />`,
  },
  {
    slug: 'table',
    name: 'Table',
    imports: 'Table, TableHeader, TableBody, TableRow, TableHead, TableCell',
    description: 'Semantic table primitives with a scroll container and caption support.',
    snippet: `<Table>
  <TableHeader>
    <TableRow><TableHead>Name</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>Ada</TableCell></TableRow>
  </TableBody>
</Table>`,
  },
  {
    slug: 'simple-data-table',
    name: 'SimpleDataTable',
    imports: 'SimpleDataTable',
    description: 'A sorted, filtered and paginated table for the common list screen.',
    snippet: `<SimpleDataTable data={members} columns={columns} searchable pagination />`,
  },
  {
    slug: 'data-table',
    name: 'DataTable',
    imports: 'DataTable',
    description: 'The full table: selection, bulk actions, column visibility and manual modes.',
    snippet: `<DataTable
  data={members}
  columns={columns}
  searchable
  enableRowSelection
  columnVisibilityToggle
  pagination
/>`,
    props: [
      { name: 'data', type: 'TData[] | Accessor<TData[]>', description: 'Rows to render.' },
      { name: 'columns', type: 'AppColumnDef<TData>[]', description: 'TanStack column definitions shared with SimpleDataTable.' },
      { name: 'enableRowSelection', type: 'boolean', defaultValue: 'false', description: 'Adds a selection column and reports rows.' },
      { name: 'manualPagination', type: 'boolean', defaultValue: 'false', description: 'Defer paging to the server with `pageCount`.' },
    ],
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    imports: 'Pagination, PaginationContent, PaginationItem, PaginationLink',
    description: 'A page rail with previous/next, ellipsis and an active page.',
    snippet: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious onClick={prev} /></PaginationItem>
    <PaginationItem><PaginationLink isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext onClick={next} /></PaginationItem>
  </PaginationContent>
</Pagination>`,
  },
  {
    slug: 'receipt',
    name: 'Receipt',
    imports: 'Receipt',
    description: 'An itemised receipt with subtotal, tax, tip and a footer slot.',
    snippet: `<Receipt
  title="Vorzela Cloud"
  items={[{ label: 'Pro plan', qty: 1, amount: 24 }]}
  subtotal={24}
  tax={3.84}
  total={27.84}
/>`,
  },
  {
    slug: 'invoice',
    name: 'Invoice',
    imports: 'Invoice',
    description: 'A printable invoice with parties, line items, tax and status.',
    snippet: `<Invoice
  number="INV-2026-014"
  status="due"
  issuedAt="2026-11-01"
  dueAt="2026-11-30"
  from={from}
  to={to}
  items={items}
  taxRate={0.16}
/>`,
  },
  {
    slug: 'list',
    name: 'List',
    imports: 'List, ListItem',
    description: 'A bordered settings/activity list with icons, descriptions and trailing slots.',
    snippet: `<List>
  <ListItem title="Production" description="Deployed 4 minutes ago" trailing={<Badge>Live</Badge>} />
</List>`,
  },
  {
    slug: 'citation',
    name: 'Citation',
    isNew: true,
    imports: 'Citation',
    description: 'An inline numbered source reference.',
    snippet: `<Citation index={1} source="VorzelaJS docs · Signals" href="/docs" />`,
  },
  {
    slug: 'blockquote',
    name: 'Blockquote',
    isNew: true,
    imports: 'Blockquote',
    description: 'A pull quote with an attribution and an accent tone.',
    snippet: `<Blockquote cite="Ada Lovelace">
  The engine weaves algebraic patterns.
</Blockquote>`,
  },
  {
    slug: 'code-block',
    name: 'CodeBlock',
    isNew: true,
    imports: 'CodeBlock',
    description: 'A copyable source block with a language label and title.',
    snippet: `<CodeBlock title="counter.tsx" language="tsx" code={source} />`,
  },
  {
    slug: 'markdown',
    name: 'Markdown',
    isNew: true,
    imports: 'Markdown',
    description: 'Renders trusted Markdown to escaped DOM without an HTML sink.',
    snippet: `<Markdown source={markdown} />`,
  },
  {
    slug: 'typography',
    name: 'Typography',
    imports: 'Heading, Code, Highlight',
    description: 'Semantic headings with decoupled visual sizes, plus inline code and highlight.',
    snippet: `<Heading as="h2" size="lg">Section</Heading>
<Code>signal(0)</Code>
<Highlight>match</Highlight>`,
  },
  {
    slug: 'number-ticker',
    name: 'NumberTicker',
    imports: 'NumberTicker',
    description: 'Animates a number towards its target with an optional suffix.',
    snippet: `<NumberTicker value={count} suffix=" builds" />`,
  },
  {
    slug: 'chat',
    name: 'Chat',
    isNew: true,
    imports: 'Chat',
    description: 'A message transcript with user, assistant and system roles.',
    snippet: `<Chat messages={messages} />`,
  },
  {
    slug: 'qr-code',
    name: 'QRCode',
    imports: 'QRCode',
    description: 'An SVG QR code with error-correction level, colours and a caption.',
    snippet: `<QRCode value="https://vorzela.dev/ui" size={160} caption="vorzela.dev/ui" />`,
  },
  {
    slug: 'virtual-list',
    name: 'VirtualList',
    imports: 'VirtualList',
    description: 'Windowed rows for long lists; only the visible slice is mounted.',
    snippet: `<VirtualList
  items={rows}
  itemHeight={32}
  height={240}
  getKey={(row) => row.id}
  renderItem={(row) => <Row row={row} />}
/>`,
  },
  {
    slug: 'icon',
    name: 'Icon',
    isNew: true,
    imports: 'Icon, createIcon',
    description: 'The base SVG icon and a factory for your own icon sets.',
    snippet: `<Icon node={[['path', { d: 'M12 2 2 22h20L12 2Z' }]]} />

const Triangle = createIcon([
  ['path', { d: 'M12 2 2 22h20L12 2Z' }],
])`,
  },
  {
    slug: 'lightbox',
    name: 'Lightbox',
    isNew: true,
    imports: 'Lightbox',
    description: 'A full-screen image overlay with caption and Escape-to-close.',
    snippet: `<Lightbox open={open} src={src} alt="Screenshot" onClose={() => setOpen(false)} />`,
  },
]

const surfaces: Entry[] = [
  {
    slug: 'card',
    name: 'Card',
    imports: 'Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter',
    description: 'The base surface for grouped content, with padding, flat and interactive variants.',
    snippet: `<Card padded>
  <CardHeader>
    <CardTitle>Release notes</CardTitle>
    <CardDescription>v0.2.0</CardDescription>
  </CardHeader>
  <CardContent>Direct DOM bindings.</CardContent>
  <CardFooter><Button size="sm">Read more</Button></CardFooter>
</Card>`,
  },
  {
    slug: 'glass-panel',
    name: 'GlassPanel',
    imports: 'GlassPanel',
    description: 'A translucent surface with backdrop blur and an opaque fallback.',
    snippet: `<GlassPanel>Glass surface</GlassPanel>`,
  },
  {
    slug: 'aspect-ratio',
    name: 'AspectRatio',
    imports: 'AspectRatio',
    description: 'Holds a box to a ratio so media never shifts the layout.',
    snippet: `<AspectRatio ratio={16 / 9}>
  <img src={src} alt="" />
</AspectRatio>`,
  },
  {
    slug: 'bento-grid',
    name: 'BentoGrid',
    imports: 'BentoGrid, BentoItem',
    description: 'A responsive bento layout with column and row spans.',
    snippet: `<BentoGrid>
  <BentoItem colSpan={2} rowSpan={2}>Feature</BentoItem>
  <BentoItem>Metric</BentoItem>
</BentoGrid>`,
  },
  {
    slug: 'masonry-grid',
    name: 'MasonryGrid',
    imports: 'MasonryGrid, MasonryTile',
    description: 'A column masonry gallery with optional scrolling and max height.',
    snippet: `<MasonryGrid columns={3} gap={12} maxHeight={360} scrollable>
  <MasonryTile title="Tokens" meta="Primitives">…</MasonryTile>
</MasonryGrid>`,
  },
  {
    slug: 'separator',
    name: 'Separator',
    imports: 'Separator',
    description: 'A horizontal or vertical rule with an optional centred label.',
    snippet: `<Separator />
<Separator orientation="vertical" />
<Separator label="or" />`,
  },
  {
    slug: 'scroll-area',
    name: 'ScrollArea',
    imports: 'ScrollArea',
    description: 'A styled scroll container with axis control and fade edges.',
    snippet: `<ScrollArea height="12rem" fade>
  <LongList />
</ScrollArea>`,
  },
  {
    slug: 'resizable',
    name: 'Resizable',
    imports: 'ResizablePanelGroup, ResizablePanel, ResizableHandle',
    description: 'Draggable split panes with min sizes and keyboard handles.',
    snippet: `<ResizablePanelGroup direction="horizontal">
  {() => (
    <>
      <ResizablePanel defaultSize={2}><Sidebar /></ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={3}><Canvas /></ResizablePanel>
    </>
  )}
</ResizablePanelGroup>`,
  },
  {
    slug: 'layer',
    name: 'Layer',
    isNew: true,
    imports: 'Layer',
    description: 'A positioning layer that can portal to `document.body`.',
    snippet: `<Layer portal={false}>Floating content</Layer>`,
  },
  {
    slug: 'overlay',
    name: 'Overlay',
    isNew: true,
    imports: 'Overlay',
    description: 'The dimmed backdrop shared by dialogs and sheets.',
    snippet: `<Overlay />`,
  },
  {
    slug: 'watermark',
    name: 'Watermark',
    imports: 'Watermark',
    description: 'A repeated SVG watermark painted above arbitrary content.',
    snippet: `<Watermark content="Confidential">
  <Report />
</Watermark>`,
  },
]

const layout: Entry[] = [
  {
    slug: 'layout',
    name: 'Layout primitives',
    imports: 'Stack, Inline, Grid, Flex, Split, Container, PageSection',
    description: 'Spacing and flow primitives so pages never invent one-off flex rules.',
    snippet: `<Stack gap={4}>
  <Inline gap={2}><Badge>One</Badge><Badge>Two</Badge></Inline>
  <Grid min="9rem" gap={3}><Card /><Card /></Grid>
  <Split side={<Filters />} sideWidth="14rem"><Results /></Split>
</Stack>`,
  },
  {
    slug: 'app-shell',
    name: 'AppShell',
    imports: 'AppShell',
    description: 'The responsive frame: sidebar, mobile drawer, skip link and sticky topbar.',
    snippet: `<AppShell
  title="Overview"
  brand="Vorzela"
  currentPath={path}
  groups={groups}
>
  <PageContent />
</AppShell>`,
  },
  {
    slug: 'collapsible',
    name: 'Collapsible',
    imports: 'Collapsible, CollapsibleTrigger, CollapsibleContent',
    description: 'A disclosure that animates height and unmounts its content on close.',
    snippet: `<Collapsible defaultOpen={false}>
  {() => (
    <>
      <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
      <CollapsibleContent>…</CollapsibleContent>
    </>
  )}
</Collapsible>`,
  },
  {
    slug: 'size-context',
    name: 'SizeProvider',
    isNew: true,
    imports: 'SizeProvider, useSize',
    description: 'A context that scales descendant controls between sm, md and lg.',
    snippet: `<SizeProvider size="sm">
  <Button>Continue</Button>
</SizeProvider>`,
  },
]

const navigation: Entry[] = [
  {
    slug: 'accordion',
    name: 'Accordion',
    imports: 'Accordion',
    description: 'A single- or multi-open disclosure list with animated panels.',
    snippet: `<Accordion
  type="multiple"
  defaultValue={['signals']}
  items={[{ id: 'signals', title: 'How do signals work?', content: <p>…</p> }]}
/>`,
  },
  {
    slug: 'anchor',
    name: 'Anchor',
    imports: 'Anchor',
    description: 'A section rail that tracks the active heading and scrolls smoothly.',
    snippet: `<Anchor items={sections} activeId={active} onChange={setActive} />`,
  },
  {
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    imports: 'Breadcrumb',
    description: 'The current location path with links and a current page.',
    snippet: `<Breadcrumb items={[{ label: 'Projects', href: '/projects' }, { label: 'Components', current: true }]} />`,
  },
  {
    slug: 'nav-icon',
    name: 'NavIcon',
    isNew: true,
    imports: 'NavIcon',
    description: 'An icon-only navigation target with a label and active state.',
    snippet: `<NavIcon icon={<Home />} label="Home" active />`,
  },
  {
    slug: 'navigation-menu',
    name: 'NavigationMenu',
    imports: 'NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent',
    description: 'A top-level menu with hover panels and shared open state.',
    snippet: `<NavigationMenu>
  {() => (
    <NavigationMenuList>
      <NavigationMenuItem value="product">
        <NavigationMenuTrigger>Product</NavigationMenuTrigger>
        <NavigationMenuContent>…</NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  )}
</NavigationMenu>`,
  },
  {
    slug: 'outline',
    name: 'Outline',
    isNew: true,
    imports: 'Outline',
    description: 'A table-of-contents list with an externally controlled active id.',
    snippet: `<Outline items={headings} activeId={active} />`,
  },
  {
    slug: 'sidebar',
    name: 'Sidebar',
    imports: 'Sidebar',
    description: 'The collapsible navigation rail with groups, nesting and a mobile drawer.',
    snippet: `<Sidebar
  groups={groups}
  brand="Vorzela"
  currentPath={path}
  defaultCollapsed={false}
/>`,
    props: [
      { name: 'groups', type: 'SidebarNavGroup[]', description: 'Grouped items; items may nest children.' },
      { name: 'contained', type: 'boolean', defaultValue: 'false', description: 'Renders in-flow instead of fixed to the viewport.' },
      { name: 'currentPath', type: 'string | Accessor<string>', description: 'Marks the active route.' },
      { name: 'mobileOpen', type: 'boolean | Accessor<boolean>', description: 'Controls the drawer on small screens.' },
    ],
  },
  {
    slug: 'stepper',
    name: 'Stepper',
    imports: 'Stepper',
    description: 'A numbered progress rail for multi-step flows.',
    snippet: `<Stepper current={step} onStepChange={setStep} steps={steps} />`,
  },
  {
    slug: 'tab-bar',
    name: 'TabBar',
    imports: 'TabBar',
    description: 'A bottom or inline tab rail for mobile navigation.',
    snippet: `<TabBar value={tab} onChange={setTab} items={tabs} />`,
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    imports: 'Tabs, TabsList, TabsTrigger, TabsContent',
    description: 'A controlled or uncontrolled tab set with arrow-key navigation.',
    snippet: `<Tabs defaultValue="preview">
  {() => (
    <>
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">…</TabsContent>
    </>
  )}
</Tabs>`,
  },
  {
    slug: 'header',
    name: 'Header',
    imports: 'Header',
    description: 'A page heading row with menu button, description and actions.',
    snippet: `<Header
  title="Components"
  description="140 primitives"
  onMenuClick={openNav}
  actions={<Button size="sm">New</Button>}
/>`,
  },
  {
    slug: 'topbar',
    name: 'Topbar',
    imports: 'Topbar',
    description: 'A compact sticky bar with a menu button and action slot.',
    snippet: `<Topbar title="Overview" onMenuClick={openNav} actions={<Badge>Live</Badge>} />`,
  },
]

const overlays: Entry[] = [
  {
    slug: 'alert-dialog',
    name: 'AlertDialog',
    imports: 'AlertDialog',
    description: 'A modal confirmation that requires an explicit cancel or action.',
    snippet: `<AlertDialog
  open={open}
  onOpenChange={setOpen}
  destructive
  title="Delete project?"
  description="This cannot be undone."
  onAction={remove}
/>`,
  },
  {
    slug: 'drawer',
    name: 'Drawer',
    imports: 'Drawer',
    description: 'A side panel that traps focus and locks body scroll.',
    snippet: `<Drawer open={open} onClose={close} title="Filters" side="left">
  <Filters />
</Drawer>`,
  },
  {
    slug: 'hover-card',
    name: 'HoverCard',
    imports: 'HoverCard, HoverCardTrigger, HoverCardContent',
    description: 'A delayed hover panel for profiles and previews.',
    snippet: `<HoverCard>
  {() => (
    <>
      <HoverCardTrigger><Button>@ada</Button></HoverCardTrigger>
      <HoverCardContent>Profile</HoverCardContent>
    </>
  )}
</HoverCard>`,
  },
  {
    slug: 'modal',
    name: 'Modal',
    imports: 'Modal',
    description: 'A centred dialog with size presets, focus trap and a footer slot.',
    snippet: `<Modal open={open} onClose={close} title="Invite members" size="md" footer={footer}>
  <InviteForm />
</Modal>`,
    props: [
      { name: 'open', type: 'boolean | Accessor<boolean>', description: 'Controlled visibility.' },
      { name: 'size', type: 'sm | md | lg | xl | full', defaultValue: 'md', description: 'Maximum panel width.' },
      { name: 'footer', type: 'ReactNode', description: 'Action row pinned under the body.' },
    ],
  },
  {
    slug: 'popover',
    name: 'Popover',
    imports: 'Popover, PopoverTrigger, PopoverContent',
    description: 'A non-modal anchored panel with collision handling.',
    snippet: `<Popover>
  {() => (
    <>
      <PopoverTrigger><Button>Options</Button></PopoverTrigger>
      <PopoverContent side="bottom">…</PopoverContent>
    </>
  )}
</Popover>`,
  },
  {
    slug: 'sheet',
    name: 'Sheet',
    imports: 'Sheet',
    description: 'An edge sheet with a title, description and footer.',
    snippet: `<Sheet open={open} onClose={close} side="right" title="Release notes" footer={footer}>
  <Changelog />
</Sheet>`,
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    imports: 'Tooltip',
    description: 'A short label on hover or focus that repositions with its trigger.',
    snippet: `<Tooltip content="Save changes">
  <Button>Hover me</Button>
</Tooltip>`,
    props: [
      { name: 'content', type: 'ReactNode', description: 'The tooltip body. Keep it short.' },
      { name: 'placement', type: 'top | bottom | left | right', defaultValue: 'top', description: 'Preferred side; flips on collision.' },
      { name: 'delayShow', type: 'number', description: 'Milliseconds before showing.' },
      { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Suppresses the tooltip.' },
    ],
  },
]

const media: Entry[] = [
  {
    slug: 'carousel',
    name: 'Carousel',
    imports: 'Carousel',
    description: 'A scroll-snap carousel with arrows, dots and optional autoplay.',
    snippet: `<Carousel
  label="Screenshots"
  slides={[{ id: 'one', content: <img src={src} alt="" /> }]}
/>`,
  },
  {
    slug: 'marquee',
    name: 'Marquee',
    imports: 'Marquee',
    description: 'A CSS-only scrolling strip that clones its content for the loop.',
    snippet: `<Marquee speed={22} pauseOnHover>
  <Badge>Signals</Badge>
  <Badge>No virtual DOM</Badge>
</Marquee>`,
  },
  {
    slug: 'optimized-image',
    name: 'OptimizedImage',
    imports: 'OptimizedImage',
    description: 'A responsive image with aspect ratio, skeleton, fallback and priority loading.',
    snippet: `<OptimizedImage
  src={src}
  alt="Screenshot"
  width={960}
  height={540}
  aspectRatio="16 / 9"
  priority
/>`,
  },
  {
    slug: 'image-cropper',
    name: 'ImageCropper',
    imports: 'ImageCropper',
    description: 'An interactive crop surface with zoom, aspect lock and encoded output.',
    snippet: `<ImageCropper
  src={src}
  aspectRatio={16 / 9}
  cropShape="rect"
  onCrop={(result) => save(result.blob)}
/>`,
  },
]

const charts: Entry[] = [
  {
    slug: 'bar-chart',
    name: 'BarChart',
    imports: 'BarChart',
    description: 'Grouped, stacked or horizontal bars with grid, animation and a data table.',
    snippet: `<BarChart data={rows} xKey="month" series={series} title="Monthly builds" />`,
  },
  {
    slug: 'line-chart',
    name: 'LineChart',
    imports: 'LineChart',
    description: 'Lines with curve control, dots, area fill and a shared tooltip.',
    snippet: `<LineChart data={rows} xKey="month" series={series} curve="natural" showArea showDots />`,
  },
  {
    slug: 'donut-chart',
    name: 'DonutChart',
    imports: 'DonutChart',
    description: 'A proportional ring with labels, padding and a centre label.',
    snippet: `<DonutChart data={rows} nameKey="channel" valueKey="visits" centerLabel="10k visits" />`,
  },
  {
    slug: 'scatter-chart',
    name: 'ScatterChart',
    imports: 'ScatterChart',
    description: 'A point cloud with an optional size key for bubble charts.',
    snippet: `<ScatterChart data={rows} xKey="builds" yKey="previews" sizeKey="size" />`,
  },
  {
    slug: 'heatmap',
    name: 'Heatmap',
    imports: 'Heatmap',
    description: 'A two-axis intensity grid for activity and density.',
    snippet: `<Heatmap data={rows} xKey="day" yKey="week" valueKey="value" />`,
  },
  {
    slug: 'sparkline',
    name: 'Sparkline',
    imports: 'Sparkline',
    description: 'A tiny inline trend line for tables and stat tiles.',
    snippet: `<Sparkline data={rows} valueKey="builds" height={48} />`,
  },
  {
    slug: 'gauge',
    name: 'Gauge',
    imports: 'Gauge',
    description: 'A radial gauge for a value against a maximum.',
    snippet: `<Gauge value={72} label="Coverage" />`,
  },
  {
    slug: 'radar-chart',
    name: 'RadarChart',
    imports: 'RadarChart',
    description: 'A multi-axis comparison across one or more series.',
    snippet: `<RadarChart data={rows} axisKey="axis" series={series} maxValue={100} />`,
  },
  {
    slug: 'treemap-chart',
    name: 'TreemapChart',
    imports: 'TreemapChart',
    description: 'A nested area chart for composition and bundle size.',
    snippet: `<TreemapChart data={{ name: 'runtime', children: parts }} />`,
  },
  {
    slug: 'sankey-chart',
    name: 'SankeyChart',
    imports: 'SankeyChart',
    description: 'A flow diagram for pipelines and conversions between stages.',
    snippet: `<SankeyChart nodes={nodes} links={links} />`,
  },
  {
    slug: 'funnel-chart',
    name: 'FunnelChart',
    imports: 'FunnelChart',
    description: 'A staged funnel for signup and activation drop-off.',
    snippet: `<FunnelChart data={stages} />`,
  },
  {
    slug: 'candlestick-chart',
    name: 'CandlestickChart',
    imports: 'CandlestickChart',
    description: 'Open/high/low/close candles for price and range data.',
    snippet: `<CandlestickChart data={candles} />`,
  },
  {
    slug: 'waterfall-chart',
    name: 'WaterfallChart',
    imports: 'WaterfallChart',
    description: 'A running total chart for bridges and contributions.',
    snippet: `<WaterfallChart data={steps} />`,
  },
  {
    slug: 'histogram-chart',
    name: 'HistogramChart',
    imports: 'HistogramChart',
    description: 'A binned distribution of raw values.',
    snippet: `<HistogramChart values={durations} bins={14} />`,
  },
  {
    slug: 'radial-bar-chart',
    name: 'RadialBarChart',
    imports: 'RadialBarChart',
    description: 'Concentric rings comparing several percentages.',
    snippet: `<RadialBarChart data={quotas} max={100} />`,
  },
  {
    slug: 'bullet-chart',
    name: 'BulletChart',
    imports: 'BulletChart',
    description: 'A target-versus-actual bar with qualitative ranges.',
    snippet: `<BulletChart data={levels} />`,
  },
]

export const components: ComponentDoc[] = [
  ...build(actions, 'Actions'),
  ...build(forms, 'Forms'),
  ...build(feedback, 'Feedback'),
  ...build(dataDisplay, 'Data display'),
  ...build(surfaces, 'Surfaces'),
  ...build(layout, 'Layout'),
  ...build(navigation, 'Navigation'),
  ...build(overlays, 'Overlays'),
  ...build(media, 'Media'),
  ...build(charts, 'Charts'),
]

export const componentBySlug: Map<string, ComponentDoc> = new Map(
  components.map((component) => [component.slug, component]),
)

export function componentsInGroup(group: ComponentGroup): ComponentDoc[] {
  return components.filter((component) => component.group === group)
}
