# capigo-ui

A [shadcn registry](https://ui.shadcn.com/docs/registry) of components built for Capigo and
usable in any shadcn app. MIT licensed.

| Item | What it is |
|---|---|
| `status-split-pill` | A lifecycle status control: the current status as a dot and label, a menu of allowed transitions, and a chevron that takes the happy-path transition. |
| `progress-circle` | A small ring that shows a percentage, for a card or a table cell where a bar would not fit. |
| `confirmation-dialog` | A confirmation dialog, simple or type-to-confirm, with its buttons on one row at every width. |
| `copy-button` | A button that copies a value with a short burst, and `CopyableCode`: a code with that button beside it. |

## Install

Pin a release tag. `#ref` takes a tag, a branch or a full commit SHA; prefer a tag:

```bash
npx shadcn@latest add vtech-com/capigo-ui/status-split-pill#v0.2.0
```

Without `#ref` the CLI installs whatever is on the default branch, which can change under you.
A GitHub address reads the root `registry.json` and the source files at that ref.

By the built file's URL, pinned to the same tag:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/vtech-com/capigo-ui/v0.2.0/public/r/status-split-pill.json
```

From a local checkout:

```bash
npx shadcn@latest add ./capigo-ui/public/r/status-split-pill.json
```

Each item lands in your `components` alias as `<item>.tsx`. `status-split-pill` installs the
shadcn primitives it composes: `alert-dialog`, `badge`, `button`, `button-group`, `dropdown-menu`
and `tooltip`, plus `lucide-react`. `progress-circle` needs nothing beyond `cn`. `confirmation-dialog` installs `alert-dialog`, `button`, `input` and `label`, plus `lucide-react`. `copy-button` installs `button` and `tooltip`, plus `lucide-react`. Releases are listed in [CHANGELOG.md](CHANGELOG.md).

## Develop

```bash
npm install
npm run build          # shadcn build: writes public/r/
npm run typecheck
npm run lint
npm test
npm run check:build    # fails when public/r/ is stale
npm run check:schema   # validates the registry JSON against ui.shadcn.com/schema
npm run smoke          # installs every item into a fresh shadcn Vite app and builds it (needs network)
```

Commit the build with the source change. CI runs every check above on each pull request and on
`main`.

The shadcn CLI is pinned to one exact version (`4.21.0`) because two versions can build different
JSON. Every other devDependency is pinned exactly too, so the repo keeps no lockfile; `.gitignore`
excludes them.

Each item's source is `src/<item>/<item>.tsx`, with its demo beside it and its tests in
`src/<item>/__tests__/`. An item imports only the shadcn paths `@/components/ui/*` and
`@/lib/utils`, so `shadcn add` rewrites them to the consumer's aliases. It carries no product
copy, no i18n, no toasts and no server calls: labels, colours, transitions and handlers are all
props.

`src/components/ui/` and `src/lib/utils.ts` are dev-only: the upstream `radix-nova` primitives,
installed with `shadcn add` so the item typechecks and tests here. They are not part of any item.

## Contributing

Read [AGENTS.md](AGENTS.md) first. It is binding for people and agents alike: what an item may
import, what every change ships (a test, a rebuilt `public/r/`, a README update and a changelog
entry), and how versions are bumped.

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

## `progress-circle`

A `role="progressbar"` ring. Name it with `aria-label`: the ring is hidden from assistive
technology, and the value label is decoration.

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | `number` | — | A percentage. Clamped to 0–100 and rounded; a non-finite value reads as 0. |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | 14, 18 or 24 px, with `text-xs`, `text-sm` or `text-base`. |
| `showValue` | `boolean` | `false` | Shows `NN%` after the ring. |
| `classNames` | slot map | — | `svg`, `track`, `indicator`, `value`. The ring defaults to `stroke-primary` on `stroke-primary/20`. |

Every other prop, `className` included, goes to the root `span`.

```tsx
<ProgressCircle
  value={40}
  showValue
  aria-label="Board progress"
  classNames={{ track: "stroke-destructive/20", indicator: "stroke-destructive" }}
/>
```

`src/progress-circle/progress-circle-demo.tsx` renders the sizes and a recoloured ring.

## `confirmation-dialog`

One export, `ConfirmationDialog`, built on `AlertDialog`. Shadcn's footer stacks its buttons in a
column below `sm` with the primary action on top; here the footer stays on one row at every
width, right-aligned, confirm last, buttons at natural width. Typed mode puts the Esc hint on
the left of the same row.

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `open`, `onOpenChange` | `boolean`, `(open) => void` | — | Controlled state. |
| `message` | `ReactNode` | — | The body text. |
| `mode` | `"typed" \| "simple"` | `"typed"` | `"typed"` asks the user to type `confirmText` before confirm enables. |
| `confirmText` | `string` | `""` | The phrase to type. Required in typed mode. |
| `onConfirm` | `() => void \| boolean \| Promise<void \| boolean>` | — | Return `false` or throw to keep the dialog open; otherwise it closes. |
| `confirmVariant` | `"default" \| "destructive"` | `"destructive"` typed, `"default"` simple | The confirm button look. |
| `busy` | `boolean` | `false` | External pending state: disables both buttons. |
| `confirmDisabled` | `boolean` | `false` | Disables confirm only. |
| `children` | `ReactNode` | — | Extra content between the message and the input. |
| `contentTestId`, `confirmTestId`, `testIdPrefix` | `string` | `"confirmation-dialog"`, `"confirm-button"`, none | `data-testid`s; the prefix adds `<prefix>-cancel`. |
| `title`, `confirmButtonText`, `cancelButtonText` | `string` | `"Delete"`, `"Confirm"`, `"Cancel"` | Labels. |
| `irreversibleWarningText` | `string` | typed: `"This action cannot be undone."`; simple: none | Warning line. |
| `typeToConfirmPrefixText`, `typeToConfirmSuffixText` | `string` | `"Type"`, `"to confirm."` | Text around the phrase. |
| `copyConfirmTextAriaLabel`, `copiedAriaLabel` | `string` | `"Copy confirmation text"`, `"Copied"` | Copy button names. |
| `inputLabel`, `inputAriaLabel` | `string` | `"Type confirmation text"` | The input's label. |
| `escHintText` | `string` | `"Press ESC to cancel."` | Typed-mode hint. |

All text defaults are English; pass translated strings.

```tsx
<ConfirmationDialog
  open={open}
  onOpenChange={setOpen}
  mode="simple"
  message="Archive this board?"
  onConfirm={archive}
/>
```

`src/confirmation-dialog/confirmation-dialog-demo.tsx` renders both modes.

## `copy-button`

Two exports in one file: `CopyButton`, and `CopyableCode`, a code with a `CopyButton` beside it.

### `CopyButton` props

A click copies `value` with the Clipboard API, or, outside a secure context, through a hidden
textarea mounted beside the button so a focus trap such as a dialog keeps the selection. The button
then shows the copied icon and name, sets `data-copied="true"` for two seconds, and fires a burst:
dots in `--primary` and an optional tilted label, about one second long. The burst is absolutely
positioned, `pointer-events-none` and `aria-hidden`, so it neither moves the layout nor blocks the
next click. It is skipped under `prefers-reduced-motion: reduce`.

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | `string` | — | The text to copy. |
| `label`, `copiedLabel` | `string` | `"Copy"`, `"Copied"` | The accessible name, idle and for two seconds after a copy. An `aria-label` prop overrides both. |
| `burstLabel` | `ReactNode` | none | Text tilted above the button during the burst. Omit for dots only. |
| `burst` | `boolean` | `true` | `false` turns the burst off. |
| `onCopied` | `() => void` | — | Runs once after a successful copy. |
| `onCopyError` | `(error: unknown) => void` | `console.error` | Runs when the copy fails; the button stays idle. Show a toast here. |
| `onClick` | click handler | — | Runs first. Calling `event.preventDefault()` cancels the copy. |
| `tooltipLabel`, `copiedTooltipLabel` | `ReactNode` | none | Setting either wraps the button in a tooltip; each falls back to the other. |
| `icon`, `copiedIcon` | `ReactNode` | `Copy`, `Check` | The idle and copied icons. |
| `size`, `variant` | button size and variant | `"icon"`, `"ghost"` | The button look. |

Every other prop, `className` and `data-testid` included, goes to the button.

```tsx
<CopyButton
  value={order.code}
  label={t("copy")}
  copiedLabel={t("copied")}
  burstLabel={t("copiedBurst")}
  onCopyError={() => toast.error(t("copyFailed"))}
/>
```

### `CopyableCode` props

The button stays hidden until the code is hovered or holds focus, stays visible while it shows the
copied state, and is always visible on a screen that cannot hover. The code truncates and uses
tabular numbers.

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `code` | `string` | — | The code shown and copied. |
| `as` | element type | `"span"` | The element holding the code, such as `"h1"` for a page title. Anything but a span gets a `div` wrapper. |
| `className` | `string` | — | On the wrapper; text styles reach the code. |
| `data-testid` | `string` | — | On the code element. The button gets `<id>-copy`. |
| `label`, `copiedLabel`, `burstLabel`, `burst`, `onCopied`, `onCopyError`, `tooltipLabel`, `copiedTooltipLabel`, `icon`, `copiedIcon` | as `CopyButton` | as `CopyButton`, icons at `size-3.5` | Forwarded to the button. |

All text defaults are English; pass translated strings.

```tsx
<CopyableCode code={plan.code} as="h1" className="text-xl font-semibold" data-testid="plan-code" />
```

`src/copy-button/copy-button-demo.tsx` renders a plain button, one with a tooltip, and a code as a
page title.

## License

[MIT](LICENSE)
