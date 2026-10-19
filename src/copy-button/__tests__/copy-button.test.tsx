import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { CopyableCode, CopyButton } from "@/components/copy-button"

const burst = (root: HTMLElement = document.body) =>
  root.querySelector('[data-slot="copy-button-burst"]')

function stubClipboard(writeText: (text: string) => Promise<void>, secure = true) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, "isSecureContext", {
    value: secure,
    writable: true,
    configurable: true,
  })
}

function stubReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    writable: true,
    configurable: true,
  })
}

describe("CopyButton", () => {
  let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>

  beforeEach(() => {
    writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
    stubClipboard(writeText)
    stubReducedMotion(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("copies the value, reports it once and shows the copied state", async () => {
    const onCopied = vi.fn()
    render(<CopyButton value="VTECH-1" onCopied={onCopied} />)

    const button = screen.getByRole("button", { name: "Copy" })
    expect(button).toHaveAttribute("data-copied", "false")
    fireEvent.click(button)

    await waitFor(() => expect(button).toHaveAttribute("data-copied", "true"))
    expect(writeText).toHaveBeenCalledWith("VTECH-1")
    expect(onCopied).toHaveBeenCalledTimes(1)
    expect(button).toHaveAccessibleName("Copied")
  })

  it("names the button from label and copiedLabel, and lets aria-label win", async () => {
    const { rerender } = render(<CopyButton value="x" label="Sao chép" copiedLabel="Đã sao chép" />)
    const button = screen.getByRole("button", { name: "Sao chép" })
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAccessibleName("Đã sao chép"))

    rerender(<CopyButton value="x" aria-label="Copy the code" />)
    expect(screen.getByRole("button")).toHaveAccessibleName("Copy the code")
  })

  it("returns to idle two seconds after a copy", async () => {
    render(<CopyButton value="x" />)
    const button = screen.getByRole("button", { name: "Copy" })
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute("data-copied", "true"))

    await waitFor(() => expect(button).toHaveAttribute("data-copied", "false"), { timeout: 3000 })
    expect(button).toHaveAccessibleName("Copy")
  })

  it("reports a failed copy and stays idle", async () => {
    const error = new Error("denied")
    writeText.mockRejectedValue(error)
    const onCopied = vi.fn()
    const onCopyError = vi.fn()
    render(<CopyButton value="x" onCopied={onCopied} onCopyError={onCopyError} />)

    const button = screen.getByRole("button", { name: "Copy" })
    fireEvent.click(button)

    await waitFor(() => expect(onCopyError).toHaveBeenCalledWith(error))
    expect(onCopied).not.toHaveBeenCalled()
    expect(button).toHaveAttribute("data-copied", "false")
  })

  it("falls back to execCommand outside a secure context", async () => {
    stubClipboard(writeText, false)
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true })
    const onCopied = vi.fn()
    const { container } = render(
      <div>
        <CopyButton value="fallback" onCopied={onCopied} />
      </div>,
    )

    const host = container.firstElementChild as HTMLElement
    const append = vi.spyOn(host, "appendChild")
    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(onCopied).toHaveBeenCalledTimes(1))
    expect(execCommand).toHaveBeenCalledWith("copy")
    expect(writeText).not.toHaveBeenCalled()
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ value: "fallback" }))
    expect(host.querySelector("textarea")).toBeNull()
  })

  it("falls back and reports a failure when execCommand returns false", async () => {
    stubClipboard(writeText, false)
    Object.defineProperty(document, "execCommand", { value: vi.fn().mockReturnValue(false), configurable: true })
    const onCopied = vi.fn()
    const onCopyError = vi.fn()
    render(<CopyButton value="x" onCopied={onCopied} onCopyError={onCopyError} />)

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(onCopyError).toHaveBeenCalledTimes(1))
    expect(onCopied).not.toHaveBeenCalled()
    expect(screen.getByRole("button")).toHaveAttribute("data-copied", "false")
  })

  it("lets onClick cancel the copy with preventDefault", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const onCopied = vi.fn()
    render(<CopyButton value="x" onClick={onClick} onCopied={onCopied} />)

    fireEvent.click(screen.getByRole("button"))

    await Promise.resolve()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(writeText).not.toHaveBeenCalled()
    expect(onCopied).not.toHaveBeenCalled()
    expect(screen.getByRole("button")).toHaveAttribute("data-copied", "false")
  })

  it("shows the burst with its label, hidden from assistive technology", async () => {
    render(<CopyButton value="x" burstLabel="Copied!" />)
    const button = screen.getByRole("button", { name: "Copy" })
    expect(burst()).toBeNull()

    fireEvent.click(button)

    await waitFor(() => expect(burst(button)).not.toBeNull())
    expect(burst(button)).toHaveAttribute("aria-hidden", "true")
    expect(burst(button)).toHaveTextContent("Copied!")
    expect(burst(button)).toHaveClass("pointer-events-none", "absolute")
    expect(button).toHaveAccessibleName("Copied")
  })

  it("shows dots only when burstLabel is omitted", async () => {
    render(<CopyButton value="x" />)
    const button = screen.getByRole("button")
    fireEvent.click(button)
    await waitFor(() => expect(burst(button)).not.toBeNull())
    expect(burst(button)).toHaveTextContent("")
  })

  it("skips the burst under reduced motion", async () => {
    stubReducedMotion(true)
    const onCopied = vi.fn()
    render(<CopyButton value="x" burstLabel="Copied!" onCopied={onCopied} />)
    fireEvent.click(screen.getByRole("button"))
    await waitFor(() => expect(onCopied).toHaveBeenCalled())
    expect(burst()).toBeNull()
  })

  it("skips the burst when burst is false", async () => {
    const onCopied = vi.fn()
    render(<CopyButton value="x" burst={false} burstLabel="Copied!" onCopied={onCopied} />)
    fireEvent.click(screen.getByRole("button"))
    await waitFor(() => expect(onCopied).toHaveBeenCalled())
    expect(burst()).toBeNull()
  })

  it("wraps in a tooltip trigger when tooltipLabel is set", () => {
    const { rerender } = render(<CopyButton value="x" />)
    // Radix's trigger marks its child with data-state.
    expect(screen.getByRole("button")).not.toHaveAttribute("data-state")

    rerender(<CopyButton value="x" tooltipLabel="Copy code" />)
    const button = screen.getByRole("button", { name: "Copy" })
    expect(button).toHaveAttribute("data-state", "closed")
  })

  it("spreads other props onto the button", () => {
    render(<CopyButton value="x" data-testid="copy" className="extra" disabled />)
    const button = screen.getByTestId("copy")
    expect(button).toHaveClass("extra")
    expect(button).toBeDisabled()
  })
})

describe("CopyableCode", () => {
  beforeEach(() => {
    stubClipboard(vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined))
    stubReducedMotion(false)
  })

  it("renders the code as the given element, with a copy button that copies it", async () => {
    const onCopied = vi.fn()
    render(
      <CopyableCode
        code="VTECH-1"
        as="h1"
        data-testid="c"
        label="Copy code"
        copiedLabel="Code copied"
        onCopied={onCopied}
      />,
    )

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("VTECH-1")
    expect(heading).toHaveAttribute("data-testid", "c")
    expect(heading).toHaveClass("truncate", "tabular-nums")

    const button = screen.getByTestId("c-copy")
    expect(button).toHaveAccessibleName("Copy code")
    fireEvent.click(button)

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("VTECH-1"))
    await waitFor(() => expect(button).toHaveAccessibleName("Code copied"))
    expect(onCopied).toHaveBeenCalledTimes(1)
  })

  it("defaults to a span and hides the button until hover or focus", () => {
    const { container } = render(<CopyableCode code="B-7" className="text-sm" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.tagName).toBe("SPAN")
    expect(root).toHaveClass("group/code", "text-sm")
    expect(screen.getByText("B-7").tagName).toBe("SPAN")
    expect(screen.getByRole("button", { name: "Copy" })).toHaveClass(
      "opacity-0",
      "group-hover/code:opacity-100",
      "group-focus-within/code:opacity-100",
      "data-[copied=true]:opacity-100",
      "[@media(hover:none)]:opacity-100",
    )
  })
})
