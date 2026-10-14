import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { ProgressCircle } from "@/components/progress-circle"

const indicator = (el: HTMLElement) =>
  el.querySelector('[data-slot="progress-circle-indicator"]') as SVGCircleElement

describe("ProgressCircle", () => {
  it("is a named progressbar with its value", () => {
    render(<ProgressCircle value={42} aria-label="Board progress" />)
    const bar = screen.getByRole("progressbar", { name: "Board progress" })
    expect(bar).toHaveAttribute("aria-valuemin", "0")
    expect(bar).toHaveAttribute("aria-valuemax", "100")
    expect(bar).toHaveAttribute("aria-valuenow", "42")
  })

  it("hides the ring from assistive technology", () => {
    render(<ProgressCircle value={42} aria-label="p" />)
    expect(screen.getByRole("progressbar").querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it.each([
    [-5, "0"],
    [150, "100"],
    [33.6, "34"],
    [Number.NaN, "0"],
    [Number.POSITIVE_INFINITY, "0"],
  ])("reads %s as %s", (value, expected) => {
    render(<ProgressCircle value={value} aria-label="p" showValue />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", expected)
    expect(screen.getByText(`${expected}%`)).toBeInTheDocument()
  })

  it("shows the percentage only with showValue", () => {
    const { rerender } = render(<ProgressCircle value={60} aria-label="p" />)
    expect(screen.queryByText("60%")).not.toBeInTheDocument()
    rerender(<ProgressCircle value={60} aria-label="p" showValue />)
    expect(screen.getByText("60%")).toBeInTheDocument()
  })

  it("draws the indicator for the value", () => {
    render(<ProgressCircle value={25} size="sm" aria-label="p" />)
    const circle = indicator(screen.getByRole("progressbar"))
    const circumference = 2 * Math.PI * ((14 - 3) / 2)
    expect(Number(circle.getAttribute("stroke-dasharray"))).toBeCloseTo(circumference)
    expect(Number(circle.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference * 0.75)
  })

  it.each([
    ["sm", "14", "text-xs"],
    ["default", "18", "text-sm"],
    ["lg", "24", "text-base"],
  ] as const)("sizes %s to %spx", (size, px, text) => {
    render(<ProgressCircle value={10} size={size} aria-label="p" />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector("svg")).toHaveAttribute("width", px)
    expect(bar).toHaveClass(text)
  })

  it("keeps the default look and merges caller classes into each slot", () => {
    const { rerender } = render(<ProgressCircle value={10} aria-label="p" showValue />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector('[data-slot="progress-circle-track"]')).toHaveAttribute("class", "stroke-primary/20")
    expect(indicator(bar)).toHaveAttribute("class", "stroke-primary")

    rerender(
      <ProgressCircle
        value={10}
        aria-label="p"
        showValue
        className="absolute"
        classNames={{ svg: "size-5", track: "stroke-destructive/20", indicator: "stroke-destructive", value: "text-destructive" }}
      />
    )
    expect(bar).toHaveClass("absolute", "tabular-nums")
    expect(bar.querySelector("svg")).toHaveClass("-rotate-90", "size-5")
    expect(bar.querySelector('[data-slot="progress-circle-track"]')).toHaveAttribute("class", "stroke-destructive/20")
    expect(indicator(bar)).toHaveAttribute("class", "stroke-destructive")
    expect(screen.getByText("10%")).toHaveClass("text-destructive")
  })

  it("passes other props to the root", () => {
    render(<ProgressCircle value={10} aria-label="p" data-testid="ring" />)
    expect(screen.getByTestId("ring")).toHaveAttribute("data-slot", "progress-circle")
  })
})
