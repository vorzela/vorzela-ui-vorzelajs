import { describe, expect, it, vi } from 'vitest'
import { signal } from '@vorzelajs/core'
import { render } from '@vorzelajs/dom'
import { renderToString } from '@vorzelajs/server'
import {
  Blockquote,
  Button,
  Card,
  Chat,
  DataTable,
  Checkbox,
  CodeBlock,
  Icon,
  Input,
  Markdown,
  Modal,
  Outline,
  SimpleDataTable,
  SizeProvider,
  Sparkles,
  useSize,
} from '../src/index.ts'
import type { AppColumnDef } from '../src/lib/table.ts'

describe('Vorzela UI', () => {
  it('renders variants and forwards clicks', () => {
    const onClick = vi.fn()
    const container = document.createElement('div')
    render(
      <Button variant="secondary" size="lg" onClick={onClick}>
        Save
      </Button>,
      container,
    )

    const button = container.querySelector('button')!
    expect(button.className).toContain('secondary')
    expect(button.textContent).toBe('Save')
    button.click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders card sections and input hints', () => {
    const container = document.createElement('div')
    render(
      <Card>
        <Input label="Email" hint="Work address" />
      </Card>,
      container,
    )

    expect(container.querySelector('label')?.textContent).toContain('Email')
    expect(container.textContent).toContain('Work address')
    expect(container.querySelector('input')?.id).toBeTruthy()
  })

  it('updates a controlled checkbox from a signal', () => {
    const [checked, setChecked] = signal(false)
    const container = document.createElement('div')
    render(<Checkbox checked={checked} label="Subscribe" />, container)

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.checked).toBe(false)
    setChecked(true)
    expect(input.checked).toBe(true)
  })

  it('opens and closes a modal from a signal', () => {
    const [open, setOpen] = signal(false)
    const container = document.createElement('div')
    render(
      <Modal open={open} onClose={() => setOpen(false)} title="Settings">
        <p>Body</p>
      </Modal>,
      container,
    )

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    setOpen(true)
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    setOpen(false)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('provides owner-scoped size context', () => {
    function Label() {
      return <span class="size">{useSize()}</span>
    }

    const container = document.createElement('div')
    render(
      <SizeProvider size="lg">{() => <Label />}</SizeProvider>,
      container,
    )

    expect(container.querySelector('.size')?.textContent).toBe('lg')
  })

  it('renders chat messages and outline links', () => {
    const container = document.createElement('div')
    render(
      <div>
        <Chat
          messages={[
            { id: '1', role: 'user', content: 'Hello' },
            { id: '2', role: 'assistant', content: 'Hi' },
          ]}
        />
        <Outline items={[{ id: 'intro', label: 'Intro' }]} activeId="intro" />
      </div>,
      container,
    )

    expect(container.querySelectorAll('article')).toHaveLength(2)
    expect(container.querySelector('a')?.getAttribute('href')).toBe('#intro')
  })

  it('renders the Astryx-inspired content primitives', () => {
    const container = document.createElement('div')
    render(
      <div>
        <Blockquote cite="Ada">Build less.</Blockquote>
        <CodeBlock code="const x = 1" language="ts" />
        <Markdown source={'## Title\n\n**bold** and `code`'} />
      </div>,
      container,
    )

    expect(container.querySelector('blockquote')?.textContent).toContain('Build less.')
    expect(container.querySelector('figure')?.textContent).toContain('const x = 1')
    expect(container.querySelector('h2')?.textContent).toBe('Title')
    expect(container.querySelector('strong')?.textContent).toBe('bold')
  })

  it('supports both Lucide icon nodes and composed icon children', () => {
    const container = document.createElement('div')
    render(
      <Icon label="Status">
        <span>!</span>
      </Icon>,
      container,
    )

    const icon = container.querySelector('[role="img"]')
    expect(icon?.getAttribute('aria-label')).toBe('Status')
    expect(icon?.textContent).toBe('!')
  })

  it('creates Lucide icon SVGs in the SVG namespace', () => {
    const container = document.createElement('div')
    render(<Sparkles aria-hidden />, container)

    const svg = container.querySelector('svg')
    expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(svg?.querySelector('path')?.namespaceURI).toBe(
      'http://www.w3.org/2000/svg',
    )
    expect(svg?.getAttribute('width')).toBe('1em')
  })

  it('accepts a fixed pixel size on Lucide icons', () => {
    const container = document.createElement('div')
    render(<Sparkles aria-hidden size={24} />, container)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })

  it('serialises Lucide icons on the server', () => {
    const html = renderToString(() => <Sparkles aria-hidden />)

    expect(html).toContain('<svg')
    expect(html).toContain('viewBox="0 0 24 24"')
    expect(html).toContain('<path')
  })

  it('renders both data tables from the shared @vorzelajs/table features', () => {
    interface Person {
      name: string
      score: number
    }

    const rows: Person[] = [
      { name: 'Ada', score: 10 },
      { name: 'Grace', score: 9 },
    ]
    const columns: AppColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'score', header: 'Score' },
    ]

    const simple = document.createElement('div')
    render(<SimpleDataTable data={rows} columns={columns} />, simple)
    expect(simple.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(simple.textContent).toContain('Ada')
    expect(simple.textContent).toContain('Grace')

    const full = document.createElement('div')
    render(
      <DataTable data={rows} columns={columns} enableRowSelection />,
      full,
    )
    expect(full.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(full.textContent).toContain('Ada')
    expect(full.querySelector('input[type="checkbox"]')).not.toBeNull()
    expect(full.textContent).toContain('Columns')
  })

  it('renders UI components to HTML on the server', () => {
    const html = renderToString(() => (
      <Card>
        <Input label="Email" value="ada@example.com" />
        <Button>Save</Button>
      </Card>
    ))

    expect(html).toContain('<button')
    expect(html).toContain('Save')
    expect(html).toContain('Email')
    expect(html).not.toContain('document is not defined')
  })
})
