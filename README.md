# capigo-ui

A [shadcn registry](https://ui.shadcn.com/docs/registry) of components built for Capigo and
usable in any shadcn app. MIT licensed.

| Item | What it is |
|---|---|
| `status-split-pill` | A lifecycle status control: the current status as a dot and label, a menu of allowed transitions, and a chevron that takes the happy-path transition. |

## Install

From GitHub:

```bash
npx shadcn@latest add vtech-com/capigo-ui/status-split-pill
```

By the built file's URL:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/vtech-com/capigo-ui/main/public/r/status-split-pill.json
```

From a local checkout:

```bash
npx shadcn@latest add ./capigo-ui/public/r/status-split-pill.json
```

The item lands in your `components` alias as `status-split-pill.tsx`. It installs the shadcn
primitives it composes: `alert-dialog`, `badge`, `button`, `button-group`, `dropdown-menu` and
`tooltip`, plus `lucide-react`.

## Develop

```bash
npm install
npm run build
```

`build` runs `shadcn build`, which writes `public/r/`. Commit the build with the source change.

The shadcn CLI is pinned to one exact version (`4.21.0`) because two versions can build different
JSON. With one exact devDependency, the repo keeps no lockfile; `.gitignore` excludes them.

The source is `src/status-split-pill/status-split-pill.tsx`. It imports only the shadcn paths
`@/components/ui/*` and `@/lib/utils`, so `shadcn add` rewrites them to the consumer's aliases.
It carries no product copy, no i18n, no toasts and no server calls: labels, colours,
transitions and handlers are all props.

## Vendored into Capigo

Capigo's monorepo installs these items with `shadcn add` from the committed build into its shared
UI package. There the vendored file is a protected file:

- Its lint re-runs the build and the `add`, and fails when the vendored copy, the committed build
  or the CLI version drifts from this registry.
- Its pre-commit `protected-files` hook refuses an agent's commit that touches the vendored copy.
  Lint does not refuse commits.

So a change is made here, then re-vendored, and a person commits the re-vendored copy, or skips
that one hook with `LEFTHOOK_EXCLUDE=protected-files`. An agent that needs a change stops and asks.
Nobody edits the vendored copy in place.

## `status-split-pill`

Three exports, one per case:

| Export | Use it when |
|---|---|
| `StatusSplitPill` | The status has two or more transitions, or a menu plus a happy path. |
| `StatusTransitionButton` | The status has exactly one transition. |
| `StatusPillBadge` | Nothing can be done from the status: a label, not a control. |

The caller picks the export. The component never decides which transitions exist.

### `StatusSplitPill` props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `status` | `{ value, label, dotClassName?, className? }` | — | The current status. `value` is written to the label as `data-status`. |
| `options` | `StatusSplitPillOption[]` | — | Menu rows, in display order. |
| `quickAction` | option value or `null` | `null` | The option the chevron takes. `null` disables the chevron. |
| `onSelect` | `(value, source) => void` | — | `source` is `"menu"` or `"quick"`. |
| `pending` | `boolean \| "menu" \| "quick"` | `false` | Disables both halves; `"menu"` or `"quick"` also shows a spinner there. |
| `menuLabel` | `ReactNode` | — | A heading above the rows. |
| `closeOnSelect` | `boolean` | `true` | `false` keeps the menu open after a pick. |
| `variant` | button variant or `"plain"` | `"outline"` | The look of both halves. `"plain"` renders unstyled native buttons. |
| `size` | button size | `"default"` | Ignored for `"plain"`. |
| `grouped` | `boolean` | `true` | Join the halves with `ButtonGroup`, a `role="group"`; `false` renders a plain span with no role. |
| `align` | `"start" \| "center" \| "end"` | `"start"` | Menu alignment. |
| `tooltipDelay` | `number` | `0` | Delay of the disabled-reason tooltip. |
| `classNames` | slot map | — | `trigger`, `dot`, `label`, `spinner`, `content`, `menuLabel`, `item`, `itemDot`, `verb`, `quick`, `quickIcon`, `quickTooltipTrigger`. |
| `triggerProps`, `labelProps`, `quickProps`, `contentProps` | element props | — | Extra attributes such as `data-testid` or `aria-label`. `labelProps={{ "data-status": undefined }}` drops the label's `data-status`. |
| `quickIcon` | `ReactNode` | chevron | Replaces the chevron. |

Every other prop goes to the root element (the group, or the span).

### An option

| Field | Purpose |
|---|---|
| `value` | Identifies the transition. It need not be the target status: two transitions may land in the same one. |
| `label`, `dotClassName`, `className` | The row's text, dot colour and row classes. |
| `verb` | A secondary word on the row's right, such as the action's name. |
| `destructive` | A red row with a red dot. |
| `disabledReason` | Setting it alone disables the row. The reason is read out on the row, and shown as a tooltip on the chevron or the single button. |
| `disabled` | Disables the row when there is no reason to show. |
| `confirm` | `{ title, description?, confirmLabel, cancelLabel }`. The component asks in an alert dialog before calling `onSelect`. |
| `testId` | The row's `data-testid`, and the single button's. |

### A compact outline group

```tsx
<StatusSplitPill
  status={{ value: "doing", label: "Doing", dotClassName: "bg-amber-500", className: "text-amber-600" }}
  options={[
    { value: "done", label: "Done", dotClassName: "bg-emerald-600" },
    { value: "cancelled", label: "Cancelled", dotClassName: "bg-rose-500" },
  ]}
  quickAction="done"
  onSelect={(value) => save(value)}
  variant="outline"
  size="sm"
  classNames={{ trigger: "uppercase", content: "min-w-48" }}
/>
```

### A segmented box with verbs and a blocked step

```tsx
<StatusSplitPill
  status={{ value: "draft", label: "Draft", dotClassName: "bg-amber-400" }}
  options={[
    { value: "submit", label: "Pending approval", verb: "Submit", disabledReason: "Add a line first" },
    { value: "cancel", label: "Cancelled", verb: "Cancel", destructive: true },
  ]}
  quickAction="submit"
  onSelect={(value) => openDialog(value)}
  menuLabel="Change status"
  grouped={false}
  variant="plain"
  className="inline-flex h-8 items-stretch overflow-hidden rounded-lg border bg-card"
  classNames={{
    trigger: "inline-flex items-center gap-2 px-2.5 text-xs font-semibold uppercase hover:bg-muted",
    item: "gap-2 py-1.5",
    quick: "inline-flex items-center border-l px-2 hover:bg-muted disabled:opacity-45",
    quickIcon: "size-4",
  }}
/>
```

`src/status-split-pill/status-split-pill-demo.tsx` renders both looks on one lifecycle. Copy it
into an app that has the item installed.

## License

[MIT](LICENSE)
