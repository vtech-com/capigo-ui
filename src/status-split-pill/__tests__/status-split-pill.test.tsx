import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import type React from "react"

import {
  StatusPillBadge,
  StatusSplitPill,
  StatusTransitionButton,
  type StatusSplitPillOption,
} from "@/components/status-split-pill"

vi.mock("lucide-react", () => ({
  ChevronRightIcon: () => <svg data-testid="chevron-icon" />,
  Loader2Icon: () => <svg data-testid="spinner-icon" />,
  default: {},
}))

const CURRENT = { value: "draft", label: "Draft", dotClassName: "bg-amber-400" }

const OPTIONS: StatusSplitPillOption[] = [
  { value: "submit", label: "Pending", verb: "Submit", testId: "row-submit" },
  { value: "cancel", label: "Cancelled", verb: "Cancel", destructive: true, testId: "row-cancel" },
  { value: "apply", label: "Applied", disabledReason: "Add a line first", testId: "row-apply" },
]

function renderPill(props: Partial<React.ComponentProps<typeof StatusSplitPill>> = {}) {
  const onSelect = vi.fn()
  render(
    <StatusSplitPill
      status={CURRENT}
      options={OPTIONS}
      quickAction="submit"
      onSelect={onSelect}
      menuLabel="Change status"
      triggerProps={{ "data-testid": "trigger" }}
      contentProps={{ "data-testid": "menu" }}
      quickProps={{ "data-testid": "quick", "aria-label": "Quick" }}
      {...props}
    />
  )
  return onSelect
}

function openMenu() {
  fireEvent.keyDown(screen.getByTestId("trigger"), { key: "Enter" })
  return screen.getByTestId("menu")
}

describe("StatusSplitPill", () => {
  it("shows the current status as a dot and a label carrying data-status", () => {
    renderPill({ labelProps: { "data-testid": "current" } })
    const label = screen.getByTestId("current")
    expect(label).toHaveTextContent("Draft")
    expect(label).toHaveAttribute("data-status", "draft")
    expect(screen.getByTestId("trigger").querySelector("[data-slot=status-dot]")).toHaveClass(
      "bg-amber-400"
    )
  })

  it("takes the quick action from the chevron without opening the menu", () => {
    const onSelect = renderPill()
    fireEvent.click(screen.getByTestId("quick"))
    expect(onSelect).toHaveBeenCalledWith("submit", "quick")
    expect(screen.queryByTestId("menu")).not.toBeInTheDocument()
  })

  it("disables the chevron when there is no quick action", () => {
    renderPill({ quickAction: null })
    expect(screen.getByTestId("quick")).toBeDisabled()
  })

  it("lists every option under the menu label, each with its verb", () => {
    const onSelect = renderPill()
    const menu = openMenu()
    expect(within(menu).getByText("Change status")).toBeInTheDocument()
    expect(within(menu).getByTestId("row-submit")).toHaveTextContent("PendingSubmit")
    fireEvent.click(within(menu).getByTestId("row-submit"))
    expect(onSelect).toHaveBeenCalledWith("submit", "menu")
  })

  it("renders a destructive row red, with a red dot", () => {
    renderPill()
    const row = within(openMenu()).getByTestId("row-cancel")
    expect(row).toHaveAttribute("data-variant", "destructive")
    expect(row.querySelector("[data-slot=status-dot]")).toHaveClass("bg-destructive")
  })

  it("disables a row with a reason and reads the reason out", () => {
    const onSelect = renderPill()
    const row = within(openMenu()).getByTestId("row-apply")
    expect(row).toHaveAttribute("data-disabled")
    expect(within(row).getByText("Add a line first")).toHaveClass("sr-only")
    fireEvent.click(row)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("wraps a blocked chevron in a tooltip trigger", () => {
    renderPill({ quickAction: "apply" })
    const quick = screen.getByTestId("quick")
    expect(quick).toBeDisabled()
    expect(quick.parentElement).toHaveClass("cursor-not-allowed")
  })

  it("asks before an option with a confirm, and selects only on confirm", () => {
    const onSelect = renderPill({
      options: [
        {
          value: "cancel",
          label: "Cancelled",
          testId: "row-cancel",
          confirm: { title: "Cancel it?", confirmLabel: "Yes", cancelLabel: "No" },
        },
      ],
      quickAction: "cancel",
    })
    fireEvent.click(screen.getByTestId("quick"))
    expect(onSelect).not.toHaveBeenCalled()
    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("Cancel it?")).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "Yes" }))
    expect(onSelect).toHaveBeenCalledWith("cancel", "quick")
  })

  it("disables both halves while pending and spins where the pick came from", () => {
    renderPill({ pending: "quick" })
    expect(screen.getByTestId("trigger")).toBeDisabled()
    expect(screen.getByTestId("quick")).toBeDisabled()
    expect(within(screen.getByTestId("quick")).getByTestId("spinner-icon")).toBeInTheDocument()
    expect(within(screen.getByTestId("trigger")).queryByTestId("spinner-icon")).toBeNull()
  })

  it("renders plain native buttons in a span with no group role when ungrouped", () => {
    renderPill({ grouped: false, variant: "plain", className: "pill" })
    const root = screen.getByTestId("trigger").closest("[data-slot=status-split-pill]")
    expect(root?.tagName).toBe("SPAN")
    expect(root).toHaveClass("pill")
    expect(root).not.toHaveAttribute("role")
    expect(screen.queryByRole("group")).toBeNull()
    expect(screen.getByTestId("trigger")).not.toHaveAttribute("data-slot", "button")
  })

  it("keeps a role=group around the halves when grouped", () => {
    renderPill()
    expect(screen.getByRole("group")).toContainElement(screen.getByTestId("trigger"))
  })

  it("keeps the menu open after a pick when closeOnSelect is false", () => {
    const onSelect = renderPill({ closeOnSelect: false })
    fireEvent.click(within(openMenu()).getByTestId("row-submit"))
    expect(onSelect).toHaveBeenCalledWith("submit", "menu")
    expect(screen.getByTestId("menu")).toBeInTheDocument()
  })

  it("drops the label's data-status when labelProps overrides it", () => {
    renderPill({ labelProps: { "data-testid": "current", "data-status": undefined } })
    expect(screen.getByTestId("current")).not.toHaveAttribute("data-status")
  })

  it("spins on the trigger when the pending pick came from the menu", () => {
    renderPill({ pending: "menu" })
    expect(within(screen.getByTestId("trigger")).getByTestId("spinner-icon")).toBeInTheDocument()
    expect(within(screen.getByTestId("quick")).queryByTestId("spinner-icon")).toBeNull()
  })
})

describe("StatusPillBadge", () => {
  it("renders a Badge for a variant", () => {
    render(<StatusPillBadge data-testid="badge" status={CURRENT} variant="secondary" />)
    expect(screen.getByTestId("badge")).toHaveAttribute("data-slot", "badge")
    expect(screen.getByText("Draft")).toHaveAttribute("data-status", "draft")
  })

  it("passes labelProps to the label", () => {
    render(
      <StatusPillBadge
        status={CURRENT}
        labelProps={{ "data-testid": "label", className: "align-middle" }}
      />
    )
    const label = screen.getByTestId("label")
    expect(label).toHaveClass("align-middle")
    expect(label).toHaveAttribute("data-status", "draft")
  })

  it("renders an unstyled span for plain", () => {
    render(<StatusPillBadge data-testid="badge" status={CURRENT} variant="plain" className="x" />)
    const badge = screen.getByTestId("badge")
    expect(badge).toHaveAttribute("data-slot", "status-pill-badge")
    expect(badge).toHaveClass("x")
  })
})

describe("StatusTransitionButton", () => {
  it("shows the verb and selects the one transition", () => {
    const onSelect = vi.fn()
    render(<StatusTransitionButton option={OPTIONS[0] as StatusSplitPillOption} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId("row-submit"))
    expect(screen.getByTestId("row-submit")).toHaveTextContent("Submit")
    expect(onSelect).toHaveBeenCalledWith("submit")
  })

  it("disables a transition with a reason behind a tooltip trigger", () => {
    render(
      <StatusTransitionButton
        option={OPTIONS[2] as StatusSplitPillOption}
        onSelect={vi.fn()}
        tooltipTriggerClassName="wrap"
      />
    )
    const button = screen.getByTestId("row-apply")
    expect(button).toBeDisabled()
    expect(button.parentElement).toHaveClass("wrap")
  })
})
