import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { ConfirmationDialog } from "@/components/confirmation-dialog"

describe("ConfirmationDialog", () => {
  const confirmText = "mail.capigo.app"

  it("disables confirm until the typed value matches", async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        message="Danger action"
        confirmText={confirmText}
        onConfirm={onConfirm}
      />
    )

    const confirmButton = screen.getByRole("button", { name: "Confirm" })
    expect(confirmButton).toBeDisabled()

    const input = screen.getByLabelText("Type confirmation text")
    fireEvent.change(input, { target: { value: "wrong" } })
    expect(confirmButton).toBeDisabled()

    fireEvent.change(input, { target: { value: confirmText } })
    expect(confirmButton).toBeEnabled()

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("shows a check icon after copying", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        message="Danger action"
        confirmText={confirmText}
        onConfirm={vi.fn()}
      />
    )

    const copyButton = screen.getByLabelText("Copy confirmation text")
    fireEvent.click(copyButton)

    await waitFor(() =>
      expect(screen.getByLabelText("Copied")).toBeInTheDocument()
    )
    expect(writeText).toHaveBeenCalledWith(confirmText)
  })
  describe("simple mode", () => {
    const base = { open: true, onOpenChange: vi.fn(), message: "Sure?" }

    it("has no input and enables confirm immediately", () => {
      render(<ConfirmationDialog {...base} mode="simple" onConfirm={vi.fn()} />)
      expect(screen.queryByTestId("confirmation-input")).toBeNull()
      expect(screen.queryByText("Press ESC to cancel.")).toBeNull()
      expect(screen.queryByText("This action cannot be undone.")).toBeNull()
      expect(screen.getByTestId("confirm-button")).toBeEnabled()
    })

    it("renders irreversible text and children when passed", () => {
      render(
        <ConfirmationDialog {...base} mode="simple" irreversibleWarningText="Gone" onConfirm={vi.fn()}>
          <span>extra</span>
        </ConfirmationDialog>
      )
      expect(screen.getByText("Gone")).toBeInTheDocument()
      expect(screen.getByText("extra")).toBeInTheDocument()
    })

    it("uses the default variant, destructive when asked", () => {
      const { rerender } = render(<ConfirmationDialog {...base} mode="simple" onConfirm={vi.fn()} />)
      expect(screen.getByTestId("confirm-button").className).not.toContain("bg-destructive")
      rerender(<ConfirmationDialog {...base} mode="simple" confirmVariant="destructive" onConfirm={vi.fn()} />)
      expect(screen.getByTestId("confirm-button").className).toContain("bg-destructive")
    })

    it("closes after onConfirm resolves", async () => {
      const onOpenChange = vi.fn()
      render(<ConfirmationDialog {...base} onOpenChange={onOpenChange} mode="simple" onConfirm={vi.fn()} />)
      fireEvent.click(screen.getByTestId("confirm-button"))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it("stays open when onConfirm returns false", async () => {
      const onConfirm = vi.fn().mockResolvedValue(false)
      const onOpenChange = vi.fn()
      render(<ConfirmationDialog {...base} onOpenChange={onOpenChange} mode="simple" onConfirm={onConfirm} />)
      fireEvent.click(screen.getByTestId("confirm-button"))
      await waitFor(() => expect(onConfirm).toHaveBeenCalled())
      await waitFor(() => expect(screen.getByTestId("confirm-button")).toBeEnabled())
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    it("stays open when onConfirm throws", async () => {
      const onConfirm = vi.fn().mockRejectedValue(new Error("x"))
      const onOpenChange = vi.fn()
      render(<ConfirmationDialog {...base} onOpenChange={onOpenChange} mode="simple" onConfirm={onConfirm} />)
      fireEvent.click(screen.getByTestId("confirm-button"))
      await waitFor(() => expect(onConfirm).toHaveBeenCalled())
      await waitFor(() => expect(screen.getByTestId("confirm-button")).toBeEnabled())
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    it("confirmDisabled and busy disable buttons", () => {
      const { rerender } = render(
        <ConfirmationDialog {...base} mode="simple" confirmDisabled testIdPrefix="p" onConfirm={vi.fn()} />
      )
      expect(screen.getByTestId("confirm-button")).toBeDisabled()
      expect(screen.getByTestId("p-cancel")).toBeEnabled()
      rerender(<ConfirmationDialog {...base} mode="simple" busy testIdPrefix="p" onConfirm={vi.fn()} />)
      expect(screen.getByTestId("confirm-button")).toBeDisabled()
      expect(screen.getByTestId("p-cancel")).toBeDisabled()
    })

    it("honours custom test ids", () => {
      render(
        <ConfirmationDialog {...base} mode="simple" contentTestId="c" confirmTestId="ok" onConfirm={vi.fn()} />
      )
      expect(screen.getByTestId("c")).toBeInTheDocument()
      expect(screen.getByTestId("ok")).toBeInTheDocument()
    })
  })

  it("typed mode: false keeps it open and confirmVariant default is destructive", async () => {
    const onOpenChange = vi.fn()
    render(
      <ConfirmationDialog open onOpenChange={onOpenChange} message="m" confirmText="x" onConfirm={() => false} />
    )
    expect(screen.getByTestId("confirm-button").className).toContain("bg-destructive")
    fireEvent.change(screen.getByTestId("confirmation-input"), { target: { value: "x" } })
    fireEvent.click(screen.getByTestId("confirm-button"))
    await waitFor(() => expect(screen.getByTestId("confirm-button")).toBeEnabled())
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("keeps the footer on one row with confirm last, at every width", () => {
    render(<ConfirmationDialog open onOpenChange={vi.fn()} message="m" mode="simple" onConfirm={vi.fn()} />)
    const buttons = screen.getByTestId("confirm-button").parentElement as HTMLElement
    const footer = buttons.parentElement as HTMLElement
    expect(footer).toHaveClass("flex-row", "justify-end")
    expect(footer).not.toHaveClass("flex-col-reverse")
    expect(footer.className).toContain("group-data-[size=sm]/alert-dialog-content:flex")
    expect(footer.className).not.toMatch(/alert-dialog-content:grid(?![-\w])/)
    expect(buttons).not.toHaveClass("flex-wrap")
    expect(buttons.lastElementChild).toBe(screen.getByTestId("confirm-button"))
    expect(buttons.firstElementChild).toHaveTextContent("Cancel")
  })
})
