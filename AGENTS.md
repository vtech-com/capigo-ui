# Agent Rules

Binding for every change to this registry, whoever makes it. `CLAUDE.md` holds only `@AGENTS.md`.

## What an item may contain

- **Standard imports only.** An item imports `react`, the npm packages in its `dependencies`,
  `@/components/ui/*` and `@/lib/utils`. Nothing else: `shadcn add` rewrites only those aliases.
- **Every primitive it imports is in `registryDependencies`.** A `@/components/ui/x` import with
  no `x` entry installs a broken file.
- **No product logic.** No i18n, data fetching, server calls, toasts, routing or app-specific
  statuses. Labels, colours, transitions and handlers are props.
- **Additive customisation only.** Extend through variants, slot `classNames` and props. Never edit
  an upstream shadcn primitive, here or in the item: `src/components/ui/` and `src/lib/utils.ts`
  are dev-only copies from `shadcn add`, never shipped, and are refreshed only by re-adding them.
- **Accessible.** Roles, accessible names and keyboard paths are required, and each one has a test.

## What every change ships

1. A test in `src/<item>/__tests__/` that fails without the change.
2. A rebuilt `public/r/` from `npm run build`. Never hand-edit `public/r/`.
3. The item's props table in `README.md`, updated.
4. A `CHANGELOG.md` entry under `## [Unreleased]`.

## Versioning

Semver, released as git tags `vX.Y.Z` by a human. Removing or renaming a prop, export or slot,
or changing a default or behaviour a caller relies on, is a major bump. A new prop, variant or
slot is a minor. A fix is a patch. Agents never tag, release or push to `main`.

## Checks

Run all of them before a PR; CI runs the same set.

```bash
npm install
npm run typecheck      # tsc over the item, demo, tests and dev primitives
npm run lint           # biome lint; warnings fail
npm test               # vitest + Testing Library, jsdom
npm run check:build    # rebuilds public/r/ and fails if it differs from the commit
npm run check:schema   # validates registry.json and public/r/*.json against ui.shadcn.com/schema
npm run smoke          # installs the item into a fresh shadcn Vite app, then typechecks and builds it
```

`check:schema` falls back to the copies in `schema/` when offline; CI sets
`SCHEMA_SOURCE=remote` so it always checks the live schemas. `smoke` needs network.

No lockfile is kept. Every devDependency is pinned to an exact version instead; keep it that way.
