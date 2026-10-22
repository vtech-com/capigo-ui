# Changelog

All notable changes to this registry are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the registry follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Each version is a git tag `vX.Y.Z`.

## [Unreleased]

## [0.5.0] - 2026-10-22

### Fixed

- `copy-button`: a copy is announced to screen readers. A visually hidden `role="status"` region
  beside the button carries `copiedLabel` for as long as the copied state shows; a failed copy
  announces nothing. Changing only the focused button's name was often not read aloud.

### Added

- `tag-input`: `TagChip`, a filled or outlined tag chip with an optional remove button;
  `TagList`, a read-only line of chips that can end in a "+N" badge; and `TagInput`, chips plus a
  combobox that offers the tags a row does not carry yet. The name rule (`isValidName`,
  `normalizeName`, `keyOf`), matching (`searchText`, `foldText`), colours (`chipProps`), labels and
  test ids are props. `labels.create` adds a create row and a predicted Enter pick;
  `entryPosition`, `removeLastOnBackspace`, `confirmOnBlur`, `onInvalidChange` and
  `optionChipSize` cover each product's entry. Composes `badge`, `button`, `input` and `popover`,
  plus `lucide-react`.

## [0.4.0] - 2026-10-19

### Added

- `copy-button`: `CopyButton`, a button that copies a value with the Clipboard API or a textarea
  fallback, shows a copied icon, name and `data-copied` for two seconds, and fires a short burst of
  dots with an optional `burstLabel`. The burst is skipped under reduced motion or with
  `burst={false}`. `label`, `copiedLabel`, `onCopied`, `onCopyError`, tooltip labels and icons are
  props. `CopyableCode` shows a code, as any element, with that button beside it, revealed on hover
  or focus. Composes `button` and `tooltip`, plus `lucide-react`.

## [0.3.0] - 2026-10-17

### Added

- `confirmation-dialog`: `ConfirmationDialog`, a complete confirmation dialog on `AlertDialog`.
  `mode="simple"` is a yes/no; `mode="typed"` makes the user type a phrase, with a copy button.
  `onConfirm` may be async and return `false` to stay open; `busy`, `confirmDisabled`,
  `confirmVariant`, `children` and test-id props are supported, and every label is a prop. The
  footer keeps its buttons on one row at every width, right-aligned, confirm last. Composes
  `alert-dialog`, `button`, `input` and `label`, plus `lucide-react`.

## [0.2.0] - 2026-10-14

### Added

- `progress-circle`: a small percentage ring, a `role="progressbar"` with sizes `sm`, `default`
  and `lg`, an optional value label, and class slots `svg`, `track`, `indicator` and `value`. A
  non-finite value reads as 0.

## [0.1.0] - 2026-10-13

### Added

- `status-split-pill`: a lifecycle status control. `StatusSplitPill` shows the current status as
  a dot and label, opens a menu of allowed transitions, and takes the happy-path transition from a
  chevron. Rows support verbs, destructive styling, disabled reasons and confirm dialogs.
  `StatusTransitionButton` covers a status with one transition, and `StatusPillBadge` a read-only
  status. Composes `alert-dialog`, `badge`, `button`, `button-group`, `dropdown-menu` and
  `tooltip`, plus `lucide-react`.

[Unreleased]: https://github.com/vtech-com/capigo-ui/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/vtech-com/capigo-ui/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/vtech-com/capigo-ui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/vtech-com/capigo-ui/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/vtech-com/capigo-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vtech-com/capigo-ui/releases/tag/v0.1.0
