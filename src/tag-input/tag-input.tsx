"use client"

/**
 * Tags on a row: a chip, a line of chips that ends in "+N", and an entry
 * that offers the tags a row does not carry yet. The entry hands a typed or
 * picked name to its caller and never decides which tag a name is: the
 * caller's server does. The name rule, colours, labels and test ids are
 * props, so two products with different rules share one entry. Passing
 * `labels.create` turns on a "create" row for a new name, a ↵ mark on the
 * row Enter picks, and the name rule shown before Enter.
 */

import { CornerDownLeft, Plus, X } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type TagItem = { key: string; name: string }

type TagChipSize = "sm" | "md"

/** Lets a props object carry `data-testid` and other data attributes. */
type DataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined }

type TagChipProps = Omit<React.ComponentProps<"span">, "children"> &
  DataAttributes & {
  name: string
  /** Outlined: the tag reaches the row from elsewhere. Filled: the row carries it. */
  outlined?: boolean
  /** Read before the name by a screen reader on an outlined chip, e.g. "From the product:". */
  outlinedPrefix?: string
  size?: TagChipSize
  /** Shows a remove button. */
  onRemove?: () => void
  /** The remove button's accessible name. */
  removeLabel?: string
  removeProps?: Omit<React.ComponentProps<"button">, "onClick" | "type"> & DataAttributes
}

/** Colour goes in `className` or `style`; without either the chip draws neutral. */
function TagChip({
  name,
  outlined = false,
  outlinedPrefix,
  size = "md",
  onRemove,
  removeLabel,
  removeProps,
  className,
  ...props
}: TagChipProps) {
  return (
    <Badge
      data-slot="tag-chip"
      variant={outlined ? "outline" : "secondary"}
      className={cn(size === "sm" && "h-4 px-1.5", className)}
      {...props}
    >
      {outlined && outlinedPrefix ? <span className="sr-only">{outlinedPrefix}</span> : null}
      <span className="truncate">{name}</span>
      {onRemove ? (
        <button
          {...removeProps}
          type="button"
          aria-label={removeLabel}
          className={cn(
            "-mr-1 inline-flex size-4 shrink-0 items-center justify-center opacity-50 outline-none hover:opacity-100 focus-visible:opacity-100 [&_svg]:size-2.5",
            removeProps?.className,
          )}
          onClick={onRemove}
        >
          <X />
        </button>
      ) : null}
    </Badge>
  )
}

/** Everything a chip takes except its name, which comes from the tag. */
type TagChipOverrides = Omit<TagChipProps, "name">

type TagListProps<T extends TagItem> = Omit<React.ComponentProps<"div">, "children"> & {
  tags: readonly T[]
  /** Chips drawn before a "+N" badge counts the rest. Absent, every chip. */
  max?: number
  size?: TagChipSize
  /** Per-chip props: colour, `outlined`, test id, data attributes. */
  chipProps?: (tag: T, index: number) => TagChipOverrides
  /**
   * The "+N" badge's accessible name, given the hidden tags. Absent, a screen
   * reader hears "+N" followed by their names.
   */
  overflowLabel?: (hidden: readonly T[]) => string
  overflowProps?: Omit<React.ComponentProps<"span">, "children"> & DataAttributes
}

/** Renders its container even with no tag; the caller decides whether an empty line shows. */
function TagList<T extends TagItem>({
  tags,
  max,
  size = "md",
  chipProps,
  overflowLabel,
  overflowProps,
  className,
  ...props
}: TagListProps<T>) {
  const limit = max ?? tags.length
  const hidden = tags.slice(limit)
  const hiddenNames = hidden.map((tag) => tag.name).join(", ")
  const label = hidden.length > 0 ? overflowLabel?.(hidden) : undefined

  return (
    <div data-slot="tag-list" className={cn("flex flex-wrap items-center gap-1", className)} {...props}>
      {tags.slice(0, limit).map((tag, index) => (
        <TagChip key={tag.key} name={tag.name} size={size} {...chipProps?.(tag, index)} />
      ))}
      {hidden.length > 0 ? (
        <Badge
          data-slot="tag-list-overflow"
          variant="secondary"
          title={hiddenNames}
          role={label === undefined ? undefined : "img"}
          aria-label={label}
          {...overflowProps}
          className={cn(size === "sm" && "h-4 px-1.5", overflowProps?.className)}
        >
          +{hidden.length}
          {label === undefined ? <span className="sr-only">: {hiddenNames}</span> : null}
        </Badge>
      ) : null}
    </div>
  )
}

type TagInputLabels = {
  /** The entry's placeholder and accessible name. */
  add: string
  /** The compact form's button that opens the entry. */
  button: string
  /** The suggestion list's accessible name. */
  suggestions: string
  remove: (name: string) => string
  /** Shown when a typed name breaks the rule. */
  invalid: string
  /** Read before an inherited chip's name. */
  inheritedPrefix?: string
  /** The row that creates a typed name, e.g. `Create “${name}”`. Absent, no create row. */
  create?: (name: string) => string
}

type TagInputTestIds = {
  root: string
  entry: string
  add: string
  chip: string
  inheritedChip: string
  remove: string
  option: string
  optionChip: string
  enterHint: string
  create: string
  createRule: string
  error: string
}

type TagChipPlace = "value" | "inherited" | "option"

type TagInputProps<T extends TagItem> = {
  /** Tags the row carries. */
  value: readonly T[]
  /** Tags reaching the row from elsewhere: outlined, never removable here. */
  inherited?: readonly T[]
  /** Every tag that may be offered. Carried and inherited ones are left out. */
  options: readonly T[]
  /** Gets the typed name, NFC-composed and trimmed, or a picked tag's name. */
  onAdd: (name: string) => void
  onRemove: (key: string) => void
  /** The caller's name rule. A name it refuses shows `labels.invalid` and is not added. */
  isValidName: (name: string) => boolean
  /** How the rule composes a typed name, for matching and the create row. Default: NFC and trim. */
  normalizeName?: (text: string) => string
  /** The key a composed name maps to, to tell a typed name is a tag already. Default: lower case. */
  keyOf?: (name: string) => string
  /** The text an option is matched on. Default: its name. */
  searchText?: (tag: T) => string
  /** Folds text before matching. Default: strips accents and lower-cases, `đ` as `d`. */
  foldText?: (text: string) => string
  labels: TagInputLabels
  /** Inline form: chips plus a button that opens a small entry. */
  compact?: boolean
  /** Where the entry sits. `"start"` keeps it still as chips come and go. */
  entryPosition?: "start" | "end"
  /** Backspace in an empty entry removes the last carried tag. */
  removeLastOnBackspace?: boolean
  /** Leaving the full form's entry confirms what it holds, for a form that saves on submit. */
  confirmOnBlur?: boolean
  /** Told whether the entry holds a refused name, so a form can hold its submit. */
  onInvalidChange?: (invalid: boolean) => void
  disabled?: boolean
  /** Replaces the full form entry's size classes. */
  entryClassName?: string
  /** Chip size inside the suggestion list. */
  optionChipSize?: TagChipSize
  /** Per-chip props by where the chip is drawn: colour, test id, data attributes. */
  chipProps?: (tag: T, place: TagChipPlace) => TagChipOverrides
  /** Extra attributes on a suggestion row, e.g. a data attribute naming its key. */
  optionProps?: (tag: T) => DataAttributes
  testIds?: Partial<TagInputTestIds>
}

// The offer row that creates the typed name; a key never starts with NUL.
const CREATE_ROW = "\u0000create"

function defaultNormalize(text: string) {
  return text.normalize("NFC").trim()
}

function defaultKeyOf(name: string) {
  return name.toLowerCase()
}

function defaultFold(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim()
}

function EnterHint({ testId }: { testId?: string }) {
  return (
    <span aria-hidden className="ml-auto flex shrink-0 text-muted-foreground" data-testid={testId}>
      <CornerDownLeft className="size-3.5" />
    </span>
  )
}

function TagInput<T extends TagItem>({
  value,
  inherited = [],
  options,
  onAdd,
  onRemove,
  isValidName,
  normalizeName = defaultNormalize,
  keyOf = defaultKeyOf,
  searchText = (tag) => tag.name,
  foldText = defaultFold,
  labels,
  compact = false,
  entryPosition = "end",
  removeLastOnBackspace = false,
  confirmOnBlur = false,
  onInvalidChange,
  disabled = false,
  entryClassName,
  optionChipSize = "md",
  chipProps,
  optionProps,
  testIds = {},
}: TagInputProps<T>) {
  const [text, setText] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeKey, setActiveKey] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listId = React.useId()
  const offersCreate = labels.create !== undefined

  React.useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const composed = normalizeName(text)
  const needle = foldText(composed)
  const shown = new Set([...inherited, ...value].map((tag) => tag.key))
  const offered = options.filter((tag) => !shown.has(tag.key) && foldText(searchText(tag)).includes(needle))
  const typedKey = composed === "" ? "" : keyOf(composed)
  const canCreate = offersCreate && composed !== "" && !shown.has(typedKey) && !offered.some((t) => t.key === typedKey)
  const createValid = canCreate && isValidName(composed)
  // Before Enter the offer states the rule; after it the error below does, so it reads once.
  const showsRule = canCreate && !createValid && error === null
  const rows = offered.map((tag) => tag.key)
  if (createValid) rows.push(CREATE_ROW)
  // With a create row, Enter's pick is predicted and marked; without one, only an arrowed row is picked.
  const exact = offersCreate
    ? (offered.find((t) => t.key === typedKey) ?? offered.find((t) => foldText(t.name) === needle))
    : undefined
  const enterKey = activeKey ?? exact?.key ?? (createValid ? CREATE_ROW : null)
  const enterIndex = enterKey === null ? -1 : rows.indexOf(enterKey)
  const activeIndex = activeKey === null ? -1 : rows.indexOf(activeKey)
  const expanded = open && !disabled && (rows.length > 0 || showsRule)
  // Index suffix: a tag key may hold spaces, which an ID reference cannot.
  const optionId = (index: number) => `${listId}-option-${index}`
  const showsEntry = !compact || editing

  const setInvalid = (message: string | null) => {
    setError(message)
    onInvalidChange?.(message !== null)
  }

  const reset = () => {
    setText("")
    setInvalid(null)
    setActiveKey(null)
  }

  const add = (name: string) => {
    onAdd(name)
    reset()
  }

  const confirm = () => {
    if (text.trim() === "") return
    if (!isValidName(text)) {
      setInvalid(labels.invalid)
      return
    }
    add(text.normalize("NFC").trim())
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const last = rows.length - 1
    const move = (index: number) => {
      e.preventDefault()
      setOpen(true)
      setActiveKey(rows[index] ?? null)
    }
    if (e.key === "ArrowDown" && last >= 0) {
      move(enterIndex >= 0 && enterIndex < last ? enterIndex + 1 : 0)
    } else if (e.key === "ArrowUp" && last >= 0) {
      move(enterIndex > 0 ? enterIndex - 1 : last)
    } else if (e.key === "Home" && expanded && activeIndex >= 0) {
      move(0)
    } else if (e.key === "End" && expanded && activeIndex >= 0) {
      move(last)
    } else if (e.key === "Enter") {
      // Enter confirms an IME candidate; it must not add a tag.
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      const picked = expanded ? offered.find((tag) => tag.key === enterKey) : undefined
      if (picked) add(picked.name)
      else confirm()
    } else if (e.key === "Backspace" && removeLastOnBackspace && !e.repeat && text === "") {
      const lastTag = value[value.length - 1]
      if (lastTag) onRemove(lastTag.key)
    } else if (e.key === "Escape" && (expanded || (compact && editing))) {
      e.stopPropagation()
      if (expanded) setOpen(false)
      else {
        reset()
        setEditing(false)
      }
    }
  }

  const entry = showsEntry ? (
    <PopoverAnchor asChild>
      <Input
        ref={inputRef}
        value={text}
        disabled={disabled}
        placeholder={labels.add}
        aria-label={labels.add}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && enterIndex >= 0 ? optionId(enterIndex) : undefined}
        aria-invalid={error ? true : undefined}
        className={compact ? "h-6 w-32 text-xs" : (entryClassName ?? "h-7 min-w-32 flex-1")}
        data-testid={testIds.entry}
        onChange={(e) => {
          setText(e.target.value)
          setInvalid(null)
          setActiveKey(null)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false)
          if (!compact && confirmOnBlur) confirm()
          else if (compact && text === "") setEditing(false)
        }}
        onKeyDown={onKeyDown}
      />
    </PopoverAnchor>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={disabled}
      data-testid={testIds.add}
      onClick={() => setEditing(true)}
    >
      <Plus data-icon="inline-start" />
      {labels.button}
    </Button>
  )

  const chips = (
    <>
      {inherited.map((tag) => (
        <TagChip
          key={tag.key}
          name={tag.name}
          outlined
          outlinedPrefix={labels.inheritedPrefix}
          data-testid={testIds.inheritedChip}
          {...chipProps?.(tag, "inherited")}
        />
      ))}
      {value.map((tag) => (
        <TagChip
          key={tag.key}
          name={tag.name}
          data-testid={testIds.chip}
          onRemove={disabled ? undefined : () => onRemove(tag.key)}
          removeLabel={labels.remove(tag.name)}
          removeProps={testIds.remove ? { "data-testid": testIds.remove } : undefined}
          {...chipProps?.(tag, "value")}
        />
      ))}
    </>
  )

  const rowClass = "flex cursor-default items-center gap-2 px-2 py-1.5 text-sm select-none"

  return (
    <div data-slot="tag-input" className="flex min-w-0 flex-col gap-1.5" data-testid={testIds.root}>
      <Popover open={expanded}>
        <div className="flex flex-wrap items-center gap-1.5">
          {entryPosition === "start" ? entry : null}
          {chips}
          {entryPosition === "end" ? entry : null}
        </div>
        <PopoverContent
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="w-56 p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div id={listId} role="listbox" aria-label={labels.suggestions} className="max-h-60 overflow-y-auto">
            {offered.map((tag, index) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: the combobox owns the keyboard; options are reached through aria-activedescendant.
              <div
                key={tag.key}
                id={optionId(index)}
                role="option"
                tabIndex={-1}
                aria-selected={tag.key === enterKey}
                data-testid={testIds.option}
                data-tag-key={tag.key}
                {...optionProps?.(tag)}
                className={cn(rowClass, !offersCreate && "hover:bg-muted", tag.key === enterKey && "bg-muted")}
                // Keeps focus in the entry so blur does not close the offer before the pick lands.
                onMouseDown={(e) => e.preventDefault()}
                // With a ↵ mark, the pointer moves it, so one row is ever marked.
                onMouseEnter={offersCreate ? () => setActiveKey(tag.key) : undefined}
                onClick={() => add(tag.name)}
              >
                <TagChip
                  name={tag.name}
                  size={optionChipSize}
                  data-testid={testIds.optionChip}
                  {...chipProps?.(tag, "option")}
                />
                {offersCreate && tag.key === enterKey ? <EnterHint testId={testIds.enterHint} /> : null}
              </div>
            ))}
            {createValid && labels.create ? (
              // biome-ignore lint/a11y/useKeyWithClickEvents: the combobox owns the keyboard; options are reached through aria-activedescendant.
              <div
                id={optionId(offered.length)}
                role="option"
                tabIndex={-1}
                aria-selected={enterKey === CREATE_ROW}
                data-testid={testIds.create}
                className={cn(
                  rowClass,
                  offered.length > 0 && "mt-1 border-t pt-2",
                  enterKey === CREATE_ROW && "bg-muted",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveKey(CREATE_ROW)}
                onClick={confirm}
              >
                <Plus aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate">{labels.create(composed)}</span>
                {enterKey === CREATE_ROW ? <EnterHint testId={testIds.enterHint} /> : null}
              </div>
            ) : null}
            {showsRule ? (
              <div
                role="presentation"
                className={cn("px-2 py-1.5 text-xs text-muted-foreground", offered.length > 0 && "mt-1 border-t pt-2")}
                data-testid={testIds.createRule}
              >
                {labels.invalid}
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {error ? (
        <p role="alert" className="text-xs text-destructive" data-testid={testIds.error}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { TagChip, TagInput, TagList }
export type {
  DataAttributes,
  TagChipOverrides,
  TagChipPlace,
  TagChipProps,
  TagChipSize,
  TagInputLabels,
  TagInputProps,
  TagInputTestIds,
  TagItem,
  TagListProps,
}
