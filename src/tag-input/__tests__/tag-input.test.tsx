import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { TagChip, TagInput, type TagInputProps, type TagItem, TagList } from "@/components/tag-input"

const SALE = { key: "sale", name: "Sale" }
const TET = { key: "hàng tết", name: "Hàng Tết" }
const GIFT = { key: "gift", name: "Gift" }
const ALL: TagItem[] = [SALE, TET, GIFT]

const RULE = /^[\p{L}\p{Nd} _-]{1,30}$/u

const LABELS = {
  add: "Add a tag",
  button: "Tag",
  suggestions: "Suggestions",
  remove: (name: string) => `Remove ${name}`,
  invalid: "Letters and digits only",
  inheritedPrefix: "From the product:",
}

function renderInput(props: Partial<TagInputProps<TagItem>> = {}) {
  const onAdd = vi.fn<(name: string) => void>()
  const onRemove = vi.fn<(key: string) => void>()
  const view = render(
    <TagInput
      value={[]}
      options={ALL}
      onAdd={onAdd}
      onRemove={onRemove}
      isValidName={(name) => RULE.test(name.normalize("NFC").trim())}
      labels={LABELS}
      {...props}
    />,
  )
  return { ...view, onAdd, onRemove, entry: () => screen.getByRole("combobox", { name: "Add a tag" }) }
}

function type(entry: HTMLElement, text: string) {
  fireEvent.focus(entry)
  fireEvent.change(entry, { target: { value: text } })
}

const optionNames = () =>
  screen.queryAllByRole("option").map((option) => option.textContent)

describe("TagChip", () => {
  it("reads an outlined chip's prefix before its name", () => {
    render(<TagChip name="Sale" outlined outlinedPrefix="From the product:" data-testid="chip" />)
    expect(screen.getByTestId("chip")).toHaveTextContent("From the product:Sale")
    expect(screen.getByTestId("chip")).toHaveAttribute("data-variant", "outline")
  })

  it("names its remove button and calls onRemove", () => {
    const onRemove = vi.fn()
    render(<TagChip name="Sale" onRemove={onRemove} removeLabel="Remove Sale" />)
    fireEvent.click(screen.getByRole("button", { name: "Remove Sale" }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it("draws no remove button without onRemove, and a small chip at sm", () => {
    render(<TagChip name="Sale" size="sm" data-testid="chip" />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.getByTestId("chip")).toHaveClass("h-4")
  })
})

describe("TagList", () => {
  it("draws every chip without max", () => {
    render(<TagList tags={ALL} data-testid="list" />)
    expect(screen.getByTestId("list")).toHaveTextContent("SaleHàng TếtGift")
    expect(screen.getByTestId("list").querySelector('[data-slot="tag-list-overflow"]')).toBeNull()
  })

  it("counts the chips past max and names them for a screen reader", () => {
    render(<TagList tags={ALL} max={1} overflowProps={{ "data-testid": "more" }} />)
    const more = screen.getByTestId("more")
    expect(more).toHaveTextContent("+2: Hàng Tết, Gift")
    expect(more).toHaveAttribute("title", "Hàng Tết, Gift")
    expect(more).not.toHaveAttribute("role")
  })

  it("uses overflowLabel as the badge's accessible name", () => {
    render(<TagList tags={ALL} max={2} overflowLabel={(hidden) => `${hidden.length} more`} />)
    expect(screen.getByRole("img", { name: "1 more" })).toHaveTextContent("+1")
  })

  it("passes per-chip props", () => {
    render(
      <TagList
        tags={ALL}
        chipProps={(tag, index) => ({ "data-testid": `chip-${index}`, outlined: tag.key === "gift" })}
      />,
    )
    expect(screen.getByTestId("chip-2")).toHaveAttribute("data-variant", "outline")
    expect(screen.getByTestId("chip-0")).toHaveAttribute("data-variant", "secondary")
  })
})

describe("TagInput", () => {
  it("offers only the tags the row neither carries nor inherits", () => {
    const { entry } = renderInput({ value: [SALE], inherited: [GIFT] })
    fireEvent.focus(entry())
    expect(screen.getByRole("listbox", { name: "Suggestions" })).toBeInTheDocument()
    expect(optionNames()).toEqual(["Hàng Tết"])
  })

  it("matches typed text without accents", () => {
    const { entry } = renderInput()
    type(entry(), "hang te")
    expect(optionNames()).toEqual(["Hàng Tết"])
  })

  it("matches on searchText when given", () => {
    const { entry } = renderInput({ searchText: (tag) => tag.key })
    type(entry(), "gi")
    expect(optionNames()).toEqual(["Gift"])
  })

  it("adds the arrowed option on Enter", () => {
    const { entry, onAdd } = renderInput()
    type(entry(), "a")
    fireEvent.keyDown(entry(), { key: "ArrowDown" })
    expect(entry()).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[0]?.id)
    fireEvent.keyDown(entry(), { key: "Enter" })
    expect(onAdd).toHaveBeenCalledWith("Sale")
    expect(entry()).toHaveValue("")
  })

  it("moves to the first and last option with Home and End once one is active", () => {
    const { entry } = renderInput()
    fireEvent.focus(entry())
    fireEvent.keyDown(entry(), { key: "ArrowDown" })
    fireEvent.keyDown(entry(), { key: "End" })
    expect(screen.getAllByRole("option")[2]).toHaveAttribute("aria-selected", "true")
    fireEvent.keyDown(entry(), { key: "Home" })
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true")
  })

  it("adds the typed name, composed and trimmed, when no option is active", () => {
    const { entry, onAdd } = renderInput()
    type(entry(), "  Mùa he  ")
    fireEvent.keyDown(entry(), { key: "Enter" })
    expect(onAdd).toHaveBeenCalledWith("Mùa he")
  })

  it("refuses a name that breaks the rule, and tells the form", () => {
    const onInvalidChange = vi.fn()
    const { entry, onAdd } = renderInput({ onInvalidChange })
    type(entry(), "a@b")
    fireEvent.keyDown(entry(), { key: "Enter" })
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Letters and digits only")
    expect(entry()).toHaveAttribute("aria-invalid", "true")
    expect(onInvalidChange).toHaveBeenLastCalledWith(true)
    fireEvent.change(entry(), { target: { value: "ab" } })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(onInvalidChange).toHaveBeenLastCalledWith(false)
  })

  it("ignores Enter while an IME is composing", () => {
    const { entry, onAdd } = renderInput()
    type(entry(), "Sale")
    fireEvent.keyDown(entry(), { key: "Enter", isComposing: true })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it("draws no create row and predicts no pick without labels.create", () => {
    const { entry } = renderInput()
    type(entry(), "sale")
    expect(optionNames()).toEqual(["Sale"])
    expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "false")
    type(entry(), "Brand new")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  describe("with labels.create", () => {
    const create = (name: string) => `Create “${name}”`
    const testIds = { create: "create", createRule: "rule", enterHint: "hint" }

    it("offers a create row for a new name, marked as Enter's pick", () => {
      const { entry, onAdd } = renderInput({ labels: { ...LABELS, create }, testIds })
      type(entry(), "Brand new")
      const row = screen.getByTestId("create")
      expect(row).toHaveTextContent("Create “Brand new”")
      expect(row).toHaveAttribute("aria-selected", "true")
      expect(within(row).getByTestId("hint")).toBeInTheDocument()
      fireEvent.keyDown(entry(), { key: "Enter" })
      expect(onAdd).toHaveBeenCalledWith("Brand new")
    })

    it("picks the matching tag on Enter without an arrow, typed without accents", () => {
      const { entry, onAdd } = renderInput({ labels: { ...LABELS, create } })
      type(entry(), "hang tet")
      expect(screen.queryByTestId("create")).toBeNull()
      fireEvent.keyDown(entry(), { key: "Enter" })
      expect(onAdd).toHaveBeenCalledWith("Hàng Tết")
    })

    it("offers no create row for a name the row already carries", () => {
      const { entry } = renderInput({ value: [SALE], labels: { ...LABELS, create }, testIds })
      type(entry(), "SALE")
      expect(screen.queryByTestId("create")).toBeNull()
    })

    it("states the rule before Enter for an invalid name", () => {
      const { entry } = renderInput({ labels: { ...LABELS, create }, testIds })
      type(entry(), "a@b")
      expect(screen.getByTestId("rule")).toHaveTextContent("Letters and digits only")
      expect(screen.queryByTestId("create")).toBeNull()
    })

    it("creates on a click on the create row", () => {
      const { entry, onAdd } = renderInput({ labels: { ...LABELS, create }, testIds })
      type(entry(), "Brand new")
      fireEvent.click(screen.getByTestId("create"))
      expect(onAdd).toHaveBeenCalledWith("Brand new")
    })
  })

  it("removes a carried tag with its chip's button", () => {
    const { onRemove } = renderInput({ value: [SALE], testIds: { remove: "remove" } })
    fireEvent.click(screen.getByRole("button", { name: "Remove Sale" }))
    expect(onRemove).toHaveBeenCalledWith("sale")
    expect(screen.getByTestId("remove")).toBeInTheDocument()
  })

  it("draws inherited chips outlined, with no remove button", () => {
    renderInput({ inherited: [GIFT], testIds: { inheritedChip: "inherited" } })
    const chip = screen.getByTestId("inherited")
    expect(chip).toHaveTextContent("From the product:Gift")
    expect(within(chip).queryByRole("button")).toBeNull()
  })

  it("removes the last tag on Backspace in an empty entry only when asked", () => {
    const first = renderInput({ value: [SALE, GIFT] })
    fireEvent.keyDown(first.entry(), { key: "Backspace" })
    expect(first.onRemove).not.toHaveBeenCalled()
    first.unmount()
    const second = renderInput({ value: [SALE, GIFT], removeLastOnBackspace: true })
    fireEvent.keyDown(second.entry(), { key: "Backspace" })
    expect(second.onRemove).toHaveBeenCalledWith("gift")
  })

  it("confirms the typed name on blur only when asked", () => {
    const first = renderInput()
    type(first.entry(), "Draft")
    fireEvent.blur(first.entry())
    expect(first.onAdd).not.toHaveBeenCalled()
    first.unmount()
    const second = renderInput({ confirmOnBlur: true })
    type(second.entry(), "Draft")
    fireEvent.blur(second.entry())
    expect(second.onAdd).toHaveBeenCalledWith("Draft")
  })

  it("places the entry before or after the chips", () => {
    const { container, rerender } = renderInput({ value: [SALE] })
    const row = () => container.querySelector('[data-slot="tag-input"] > div') as HTMLElement
    expect(row().lastElementChild).toHaveAttribute("role", "combobox")
    rerender(
      <TagInput
        value={[SALE]}
        options={ALL}
        onAdd={() => {}}
        onRemove={() => {}}
        isValidName={() => true}
        labels={LABELS}
        entryPosition="start"
      />,
    )
    expect(row().firstElementChild).toHaveAttribute("role", "combobox")
  })

  it("opens the compact entry from its button and closes it on Escape", () => {
    renderInput({ compact: true, testIds: { add: "add" } })
    expect(screen.queryByRole("combobox")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Tag" }))
    const entry = screen.getByRole("combobox", { name: "Add a tag" })
    expect(entry).toHaveFocus()
    fireEvent.keyDown(entry, { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
    fireEvent.keyDown(entry, { key: "Escape" })
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.getByTestId("add")).toBeInTheDocument()
  })

  it("offers nothing and removes nothing when disabled", () => {
    const { entry } = renderInput({ value: [SALE], disabled: true })
    fireEvent.focus(entry())
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(screen.queryByRole("button", { name: "Remove Sale" })).toBeNull()
  })

  it("applies test ids, chip props by place and option props", () => {
    const { entry } = renderInput({
      value: [SALE],
      testIds: { root: "root", entry: "entry", chip: "chip", option: "option", optionChip: "option-chip" },
      chipProps: (tag, place) => ({ className: `color-${tag.key}`, "data-place": place }),
      optionProps: (tag) => ({ "data-label-key": tag.key }),
      optionChipSize: "sm",
    })
    fireEvent.focus(entry())
    expect(screen.getByTestId("root")).toBeInTheDocument()
    expect(screen.getByTestId("entry")).toBe(entry())
    expect(screen.getByTestId("chip")).toHaveClass("color-sale")
    expect(screen.getByTestId("chip")).toHaveAttribute("data-place", "value")
    const [option] = screen.getAllByTestId("option")
    expect(option).toHaveAttribute("data-label-key", "hàng tết")
    expect(option).toHaveAttribute("data-tag-key", "hàng tết")
    const [optionChip] = screen.getAllByTestId("option-chip")
    expect(optionChip).toHaveAttribute("data-place", "option")
    expect(optionChip).toHaveClass("h-4")
  })
})
