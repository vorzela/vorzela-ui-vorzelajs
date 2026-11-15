# VorzelaJS UI porting guide

The React + SCSS source lives in
[`vorzela/vorzela-ui`](https://github.com/vorzela/vorzela-ui). This repository
is the native VorzelaJS implementation of the same component APIs, class names,
tokens and SCSS modules. There is no local copy of the React source.

## Rules

- Components are plain functions returning DOM nodes; they run once.
- State is a signal: `const [open, setOpen] = signal(false)`; read with `open()`.
- Effects use `effect` + `onCleanup` from `@vorzelajs/core`.
- Lists use `<For each={() => items}>`; branches use `<Show when={...}>`.
- Do not import React. Use `../../types.ts` for `ReactNode`, `HTMLAttributes`,
  event types and `forwardRef`.
- Icons come from `./icons.tsx` (Lucide icon nodes rendered as SVG).
- `ref` is a prop. `forwardRef` from `../../types.ts` adapts React-shaped
  components.
- Keep class names, variants, ARIA and SCSS module imports identical.
- No `document` access at module scope; guard DOM APIs inside effects/handlers.
- Clean up listeners, observers and timers with `onCleanup`.
- Prefer `<Portal>` from `@vorzelajs/dom` for overlays.
- Run `npm run typecheck` before finishing.

## Tables

`DataTable` and `SimpleDataTable` share `src/lib/table.ts`. Both must import
`appTableFeatures` and `AppColumnDef` from that module and keep
`@vorzelajs/table` as the only table runtime. Do not add
`@tanstack/react-table`.

## Registry

`registry/` is generated from `src/`. Never edit it by hand. After changing a
component:

```bash
npm run registry:build
```

The generator normalizes shared imports to `~/...`, rewrites component SCSS
imports to `@use 'styles' as vz;`, and records runtime dependencies. The CLI
recomputes the app-specific paths when it copies a file.

## Example

```tsx
import { Show } from '@vorzelajs/dom'
import { signal } from '@vorzelajs/core'
import { cx } from '~/lib/cx.ts'
import { forwardRef } from '~/lib/types.ts'
import type { ButtonHTMLAttributes } from '~/lib/types.ts'
import styles from './example.module.scss'

export const Example = forwardRef<HTMLButtonElement, ButtonHTMLAttributes>(
  ({ className, ...props }, ref) => {
    const [open, setOpen] = signal(false)
    return (
      <button
        ref={ref}
        className={cx(styles.root, open() && styles.open, className)}
        onClick={() => setOpen(!open())}
        {...props}
      >
        <Show when={open} fallback="Closed">
          Open
        </Show>
      </button>
    )
  },
)
```

The SCSS modules in `src/components/ui` import
`@use '../../styles' as vz;`.
