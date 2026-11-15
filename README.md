# VorzelaJS UI

Native VorzelaJS components copied into your app, shadcn-style. This is not a
runtime UI package: the CLI writes the component source, SCSS modules, hooks,
primitives and shared helpers into your project so you own and restyle them.

The design language and component APIs come from
[`vorzela/vorzela-ui`](https://github.com/vorzela/vorzela-ui) (`React + SCSS`).
This repository contains the native Vorzela implementation: components are
plain functions, state is signals, branches use `Show` and lists use `For`.

## Tables use `@vorzelajs/table`

`Table` is the presentational table primitive. `DataTable` and
`SimpleDataTable` are built on `@vorzelajs/table` (TanStack Table v9 core plus
the Vorzela adapter), not a React table. Installing either one via the CLI
adds `@vorzelajs/table` to your dependencies and writes the shared
`lib/table.ts` feature set.

```bash
vorzelajs-ui add table data-table simple-data-table
```

## Install components

```bash
# from this repository, during development
node packages/cli/bin/vorzelajs-ui.mjs init
node packages/cli/bin/vorzelajs-ui.mjs add button card table data-table

# once the CLI is published
npx vorzelajs-ui init
npx vorzelajs-ui add button input dialog
```

The CLI reads `vorzelajs.ui.json` from the current directory:

```json
{
  "registry": "https://raw.githubusercontent.com/vorzela/vorzela-ui-vorzelajs/main/registry",
  "version": "0.1.0",
  "aliases": {
    "base": "~",
    "components": "~/components/ui",
    "primitives": "~/components/primitives",
    "lib": "~/lib",
    "hooks": "~/hooks",
    "styles": "~/styles",
    "charts": "~/charts"
  },
  "paths": {
    "base": "src",
    "components": "src/components/ui",
    "primitives": "src/components/primitives",
    "lib": "src/lib",
    "hooks": "src/hooks",
    "styles": "src/styles",
    "charts": "src/charts"
  },
  "css": "src/styles/global.scss"
}
```

The default registry URL assumes this repository is published at
`github.com/vorzela/vorzela-ui-vorzelajs`. Until that remote exists, pass
`--registry <path-or-url>` or set `registry` in `vorzelajs.ui.json`.

The default `~/*` alias must resolve to `src/*` in your TypeScript and Vite
configuration. Import the generated stylesheet once at the app root:

```ts
import './styles/global.scss'
```

```tsx
import { Button } from '~/components/ui/button.tsx'
import { Card } from '~/components/ui/card.tsx'
import { Input } from '~/components/ui/input.tsx'
import { Modal } from '~/components/ui/modal.tsx'
```

The CLI writes components individually; there is no copied barrel file. Import
exactly the components you added.

## Commands

| Command | Purpose |
| --- | --- |
| `vorzelajs-ui init` | Writes `vorzelajs.ui.json` and creates the configured folders. |
| `vorzelajs-ui add <component...>` | Resolves registry dependencies and copies source into the app. |
| `vorzelajs-ui list` | Lists everything in the registry. |
| `vorzelajs-ui update [component...]` | Updates installed source from the registry. |
| `vorzelajs-ui status` | Shows installed versions and local edits. |
| `vorzelajs-ui diff <component>` | Diffs one installed component against the registry. |
| `vorzelajs-ui doctor` | Checks paths, snapshots and missing files. |

`add` is idempotent and skips existing files unless `--overwrite` or `--force`
is passed. `--no-install` skips the package manager, and `--dry-run` prints the
planned writes. Component names accept kebab-case, PascalCase and scoped names:
`DataTable`, `data-table` and `@vorzelajs/data-table` are equivalent.

## Repository layout

```text
src/styles/                 tokens, mixins, reset, global entry
src/lib/                    cx, table features, overlay helpers, URL safety, refs
src/hooks/                  signal/effect hooks
src/components/ui/          130 components and SCSS modules
src/components/primitives/  portal, focus trap, dismissable layer
src/charts/                 d3 charts
registry/                   generated shadcn-style registry
packages/cli/               source-copy CLI
scripts/build-registry.mjs  regenerates registry/ from src/
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run registry:build
npm run verify
```

The CLI and registry tests copy components into a temporary project and assert
that aliases, SCSS paths and `@vorzelajs/table` dependencies are correct.

## Adding or changing a component

1. Edit the component and its SCSS module under `src/components/ui/`.
2. Run `npm run registry:build` to regenerate `registry/`.
3. Add or update a test when the behaviour changes.
4. Run `npm run verify`.

The registry generator reads imports and writes registry dependencies
automatically. Shared modules such as `icons.tsx`, `calendar-utils.ts` and
`lib/table.ts` are separate registry items so a component never depends on a
missing file.

## License

MIT. The React + SCSS design reference is also MIT.
