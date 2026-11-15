import { computed, signal } from '@vorzelajs/core'
import { Autocomplete } from '~/components/ui/autocomplete.tsx'
import { Calendar } from '~/components/ui/calendar.tsx'
import { Cascader } from '~/components/ui/cascader.tsx'
import { Checkbox } from '~/components/ui/checkbox.tsx'
import { ColorPicker } from '~/components/ui/color-picker.tsx'
import { Combobox } from '~/components/ui/combobox.tsx'
import { CurrencyInput } from '~/components/ui/currency-input.tsx'
import { DatePicker } from '~/components/ui/date-picker.tsx'
import { Editable } from '~/components/ui/editable.tsx'
import { Field, FieldGroup } from '~/components/ui/field.tsx'
import { FilePicker } from '~/components/ui/file-picker.tsx'
import { FileUpload } from '~/components/ui/file-upload.tsx'
import {
  FloatingLabelInput,
  FloatingLabelSelect,
  FloatingLabelTextarea,
} from '~/components/ui/floating-label-input.tsx'
import { ImageCropper } from '~/components/ui/image-cropper.tsx'
import { Input } from '~/components/ui/input.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '~/components/ui/input-group.tsx'
import { Label } from '~/components/ui/label.tsx'
import { Mentions } from '~/components/ui/mentions.tsx'
import { NativeSelect } from '~/components/ui/native-select.tsx'
import { NumberInput } from '~/components/ui/number-input.tsx'
import { OtpInput } from '~/components/ui/otp-input.tsx'
import { PasswordStrengthInput } from '~/components/ui/password-input.tsx'
import { PhoneInput } from '~/components/ui/phone-input.tsx'
import { RadioGroup } from '~/components/ui/radio-group.tsx'
import { RangeSlider } from '~/components/ui/range-slider.tsx'
import { Rating } from '~/components/ui/rating.tsx'
import { SearchInput } from '~/components/ui/search-input.tsx'
import { SegmentedControl } from '~/components/ui/segmented-control.tsx'
import { Select } from '~/components/ui/select.tsx'
import { Slider } from '~/components/ui/slider.tsx'
import { Switch } from '~/components/ui/switch.tsx'
import { TagInput } from '~/components/ui/tag-input.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'
import { TimePicker } from '~/components/ui/time-picker.tsx'
import { Transfer } from '~/components/ui/transfer.tsx'
import { Mail, Search } from '~/components/ui/icons.tsx'
import styles from '../docs.module.scss'

const plans = [
  { value: 'starter', label: 'Starter', description: 'One project.' },
  { value: 'pro', label: 'Pro', description: 'Unlimited projects.' },
  { value: 'enterprise', label: 'Enterprise', description: 'SSO and audit logs.' },
]

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
]

const workspaces = [
  { value: 'vorzela', label: 'Vorzela', description: 'Design system' },
  { value: 'northwind', label: 'Northwind', description: 'Commerce' },
  { value: 'globex', label: 'Globex', description: 'Research' },
]

const frameworks = ['React', 'Vue', 'Svelte', 'Solid', 'VorzelaJS']

function InputPreview() {
  return (
    <div class={styles.demoField}>
      <Input label="Email" type="email" placeholder="you@example.com" hint="We only use this for receipts." />
      <Input label="Search" leading={<Search aria-hidden />} placeholder="Search projects…" />
      <Input label="Invalid" defaultValue="not-an-email" error="Enter a valid email address." />
      <Input label="Success" defaultValue="ada@example.com" success="Looks good." />
      <Input label="Filled" appearance="filled" placeholder="Filled appearance" />
      <Input label="Outlined" appearance="outlined" placeholder="Outlined appearance" />
    </div>
  )
}

function TextareaPreview() {
  const [value, setValue] = signal('Ship the docs preview.')
  return (
    <div class={styles.demoField}>
      <Textarea
        label="Release notes"
        hint="Markdown is supported."
        maxLength={160}
        showCount
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
    </div>
  )
}

function LabelPreview() {
  return (
    <div class={styles.demoField}>
      <Label htmlFor="preview-label" required hint="Shown under the label.">
        Workspace name
      </Label>
      <Input id="preview-label" placeholder="Acme" />
    </div>
  )
}

function FieldPreview() {
  return (
    <FieldGroup>
      <Field label="Full name" htmlFor="field-name" hint="As it appears on invoices.">
        <Input id="field-name" placeholder="Ada Lovelace" />
      </Field>
      <Field label="Workspace" htmlFor="field-workspace" optional orientation="horizontal">
        <Input id="field-workspace" placeholder="acme" />
      </Field>
      <Field label="API key" htmlFor="field-key" error="This key has expired.">
        <Input id="field-key" defaultValue="sk_live_…" />
      </Field>
    </FieldGroup>
  )
}

function CheckboxPreview() {
  const [checked, setChecked] = signal(true)
  return (
    <div class={styles.demoStack}>
      <Checkbox checked={checked} onChange={setChecked} label="Email me updates" hint="A short monthly email." />
      <Checkbox defaultChecked label="Include beta features" />
      <Checkbox indeterminate label="Partially selected" />
      <Checkbox disabled label="Disabled" />
    </div>
  )
}

function RadioGroupPreview() {
  const [value, setValue] = signal('pro')
  return <RadioGroup label="Plan" options={plans} value={value} onChange={setValue} />
}

function SwitchPreview() {
  const [checked, setChecked] = signal(true)
  return (
    <div class={styles.demoStack}>
      <Switch checked={checked} onCheckedChange={setChecked} label="Product updates" description="A short monthly email." />
      <Switch label="Reverse label" reverse />
      <Switch label="Disabled" disabled />
    </div>
  )
}

function SelectPreview() {
  const [value, setValue] = signal('pro')
  return (
    <div class={styles.demoField}>
      <Select label="Plan" options={plans} value={value} onChange={setValue} />
      <Select label="Searchable" options={workspaces} searchable placeholder="Pick a workspace" />
      <Select label="Filled" options={roles} appearance="filled" />
    </div>
  )
}

function NativeSelectPreview() {
  return (
    <div class={styles.demoField}>
      <NativeSelect label="Region" defaultValue="eu" options={[
        { value: 'us', label: 'us-east-1' },
        { value: 'eu', label: 'eu-west-1' },
        { value: 'ap', label: 'ap-south-1' },
      ]} />
    </div>
  )
}

function ComboboxPreview() {
  const [value, setValue] = signal('vorzela')
  return (
    <div class={styles.demoField}>
      <Combobox label="Workspace" options={workspaces} value={value} onChange={setValue} clearable />
    </div>
  )
}

function AutocompletePreview() {
  const [query, setQuery] = signal('Vo')
  const items = computed(() =>
    frameworks.filter((item) =>
      item.toLowerCase().includes(query().toLowerCase()),
    ),
  )
  return (
    <div class={styles.demoField}>
      <Autocomplete
        query={query}
        onQueryChange={setQuery}
        items={items}
        onSelect={(item) => setQuery(item)}
        itemLabel={(item) => item}
        itemValue={(item) => item}
        label="Framework"
        placeholder="Search frameworks…"
      />
    </div>
  )
}

function SearchInputPreview() {
  return (
    <div class={styles.demoField}>
      <SearchInput
        label="Search projects"
        placeholder="Search…"
        initialHistory={['charts', 'tables', 'focus ring']}
        onSearch={() => {}}
      />
    </div>
  )
}

function NumberInputPreview() {
  const [value, setValue] = signal(12)
  return (
    <div class={styles.demoField}>
      <NumberInput label="Seats" value={value} onChange={setValue} min={1} max={50} suffix="seats" />
    </div>
  )
}

function CurrencyInputPreview() {
  const [value, setValue] = signal(2400)
  return (
    <div class={styles.demoField}>
      <CurrencyInput label="Budget" value={value} onChange={setValue} currency="USD" hint="Billed monthly." />
    </div>
  )
}

function OtpInputPreview() {
  const [value, setValue] = signal('')
  return (
    <div class={styles.demoField}>
      <OtpInput length={6} value={value} onChange={setValue} label="Verification code" />
      <p class={styles.cardText}>Entered: {() => value() || '—'}</p>
    </div>
  )
}

function TagInputPreview() {
  const [tags, setTags] = signal(['design', 'signals'])
  return (
    <div class={styles.demoField}>
      <TagInput label="Labels" value={tags} onChange={setTags} maxTags={8} />
    </div>
  )
}

function SliderPreview() {
  const [value, setValue] = signal(62)
  return (
    <div class={styles.demoField}>
      <Slider label="Radius scale" value={value} onChange={setValue} />
      <p class={styles.cardText}>Value: {() => String(value())}</p>
    </div>
  )
}

function RangeSliderPreview() {
  const [value, setValue] = signal<[number, number]>([20, 80])
  return (
    <div class={styles.demoField}>
      <RangeSlider label="Price range" value={value} onChange={setValue} min={0} max={200} />
    </div>
  )
}

function RatingPreview() {
  const [value, setValue] = signal(4)
  return (
    <div class={styles.demoStack}>
      <Rating label="Quality" value={value} onChange={setValue} showValue />
      <Rating label="Half steps" value={3.5} step={0.5} showValue />
      <Rating label="Read only" value={4} readOnly />
    </div>
  )
}

function SegmentedControlPreview() {
  const [value, setValue] = signal<'compact' | 'comfortable'>('comfortable')
  return (
    <div class={styles.demoField}>
      <SegmentedControl
        label="Density"
        value={value}
        onChange={setValue}
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'comfortable', label: 'Comfortable' },
        ]}
      />
    </div>
  )
}

function CalendarPreview() {
  const [value, setValue] = signal('2026-11-18')
  return (
    <div class={styles.demoField}>
      <Calendar value={value} onSelect={setValue} showToday />
    </div>
  )
}

function DatePickerPreview() {
  const [value, setValue] = signal('2026-11-18')
  return (
    <div class={styles.demoField}>
      <DatePicker label="Launch date" value={value} onChange={setValue} hint="Local time." />
    </div>
  )
}

function TimePickerPreview() {
  const [value, setValue] = signal('09:30')
  return (
    <div class={styles.demoField}>
      <TimePicker label="Reminder" value={value} onChange={setValue} />
    </div>
  )
}

function ColorPickerPreview() {
  const [value, setValue] = signal('#3b82f6')
  return (
    <div class={styles.demoField}>
      <ColorPicker label="Accent" value={value} onChange={setValue} presets={['#3b82f6', '#10b981', '#f59e0b', '#ef4444']} />
    </div>
  )
}

function EditablePreview() {
  return (
    <div class={styles.demoField}>
      <Editable label="Project name" defaultValue="Vorzela UI" onSave={() => {}} />
      <p class={styles.cardText}>Click the value, edit it, then press Enter.</p>
    </div>
  )
}

function MentionsPreview() {
  return (
    <div class={styles.demoField}>
      <Mentions
        label="Comment"
        defaultValue="Thanks @ada"
        suggestions={[
          { id: 'ada', label: 'Ada Lovelace', description: 'Engineering' },
          { id: 'grace', label: 'Grace Hopper', description: 'Compiler' },
        ]}
        onSelect={() => {}}
      />
    </div>
  )
}

function CascaderPreview() {
  const [value, setValue] = signal<string[]>(['eu', 'de'])
  return (
    <div class={styles.demoField}>
      <Cascader
        label="Region"
        value={value}
        onChange={(next) => setValue(next)}
        options={[
          {
            value: 'eu',
            label: 'Europe',
            children: [
              { value: 'de', label: 'Germany' },
              { value: 'fr', label: 'France' },
            ],
          },
          {
            value: 'us',
            label: 'Americas',
            children: [
              { value: 'us-east', label: 'US East' },
              { value: 'us-west', label: 'US West' },
            ],
          },
        ]}
      />
    </div>
  )
}

function TransferPreview() {
  const [keys, setKeys] = signal<string[]>(['b'])
  return (
    <Transfer
      dataSource={[
        { key: 'a', label: 'Design tokens', description: 'Primitives' },
        { key: 'b', label: 'Button', description: 'Action' },
        { key: 'c', label: 'Table', description: 'Data' },
        { key: 'd', label: 'Modal', description: 'Overlay' },
      ]}
      targetKeys={keys}
      onChange={(next) => setKeys(next)}
      titles={['Available', 'Selected']}
      searchable
      showCount
      height={220}
    />
  )
}

function FilePickerPreview() {
  return (
    <div class={styles.demoStack}>
      <FilePicker
        label="Evidence"
        variant="dropzone"
        accept={['image/*', '.pdf']}
        maxBytes={5 * 1024 * 1024}
        maxFiles={3}
        onFiles={() => {}}
      />
      <FilePicker variant="button" label="Resume" accept={['.pdf']} maxFiles={1} />
      <FilePicker variant="compact" label="Attachments" accept={['image/*']} />
    </div>
  )
}

function FileUploadPreview() {
  return (
    <FileUpload
      label="Attach evidence"
      hint="PNG, JPG or PDF up to 10 MB."
      accept={['image/png', 'image/jpeg', '.pdf']}
      maxFiles={3}
      onFiles={() => {}}
    />
  )
}

function ImageCropperPreview() {
  return (
    <ImageCropper
      src="/favicon.svg"
      fileName="mark.svg"
      aspectRatio={1}
      cropShape="rect"
      onCrop={() => {}}
    />
  )
}

function FloatingLabelPreview() {
  return (
    <div class={styles.demoField}>
      <FloatingLabelInput label="Email address" hint="Floats above the field." />
      <FloatingLabelInput label="Outlined" variant="outlined" />
      <FloatingLabelTextarea label="Message" rows={3} />
      <FloatingLabelSelect label="Plan" defaultValue="pro">
        <option value="starter">Starter</option>
        <option value="pro">Pro</option>
        <option value="enterprise">Enterprise</option>
      </FloatingLabelSelect>
    </div>
  )
}

function InputGroupPreview() {
  return (
    <div class={styles.demoField}>
      <InputGroup>
        <InputGroupAddon>
          <Mail aria-hidden />
        </InputGroupAddon>
        <InputGroupInput placeholder="you@example.com" aria-label="Email" />
      </InputGroup>
      <InputGroup>
        <InputGroupText>https://</InputGroupText>
        <InputGroupInput placeholder="acme.vorzela.dev" aria-label="Domain" />
      </InputGroup>
    </div>
  )
}

function PasswordPreview() {
  const [value, setValue] = signal('correct-horse-battery')
  return (
    <div class={styles.demoField}>
      <PasswordStrengthInput label="Password" value={value} onChange={setValue} hint="At least 12 characters." />
    </div>
  )
}

function PhonePreview() {
  const [value, setValue] = signal('+254712345678')
  return (
    <div class={styles.demoField}>
      <PhoneInput label="Phone" value={value} onChange={setValue} hint="Include the country code." />
    </div>
  )
}

export const formsPreviews = {
  input: InputPreview,
  textarea: TextareaPreview,
  label: LabelPreview,
  field: FieldPreview,
  checkbox: CheckboxPreview,
  'radio-group': RadioGroupPreview,
  switch: SwitchPreview,
  select: SelectPreview,
  'native-select': NativeSelectPreview,
  combobox: ComboboxPreview,
  autocomplete: AutocompletePreview,
  'search-input': SearchInputPreview,
  'number-input': NumberInputPreview,
  'currency-input': CurrencyInputPreview,
  'otp-input': OtpInputPreview,
  'tag-input': TagInputPreview,
  slider: SliderPreview,
  'range-slider': RangeSliderPreview,
  rating: RatingPreview,
  'segmented-control': SegmentedControlPreview,
  calendar: CalendarPreview,
  'date-picker': DatePickerPreview,
  'time-picker': TimePickerPreview,
  'color-picker': ColorPickerPreview,
  editable: EditablePreview,
  mentions: MentionsPreview,
  cascader: CascaderPreview,
  transfer: TransferPreview,
  'file-picker': FilePickerPreview,
  'file-upload': FileUploadPreview,
  'image-cropper': ImageCropperPreview,
  'floating-label-input': FloatingLabelPreview,
  'input-group': InputGroupPreview,
  'password-input': PasswordPreview,
  'phone-input': PhonePreview,
} satisfies Record<string, () => unknown>
