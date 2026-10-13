# Changelog

All notable changes to this registry are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the registry follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Each version is a git tag `vX.Y.Z`.

## [Unreleased]

## [0.1.0] - 2026-10-13

### Added

- `status-split-pill`: a lifecycle status control. `StatusSplitPill` shows the current status as
  a dot and label, opens a menu of allowed transitions, and takes the happy-path transition from a
  chevron. Rows support verbs, destructive styling, disabled reasons and confirm dialogs.
  `StatusTransitionButton` covers a status with one transition, and `StatusPillBadge` a read-only
  status. Composes `alert-dialog`, `badge`, `button`, `button-group`, `dropdown-menu` and
  `tooltip`, plus `lucide-react`.

[Unreleased]: https://github.com/vtech-com/capigo-ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vtech-com/capigo-ui/releases/tag/v0.1.0
