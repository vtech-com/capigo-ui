"use client"

/**
 * A button that copies a value, and a code with that button beside it. A
 * copy swaps the icon and the accessible name for two seconds and, unless
 * the user prefers reduced motion, fires a short burst of dots with an
 * optional label. The burst is absolutely positioned and ignores the
 * pointer, so it never moves the layout or blocks the next click. Every
 * label is a prop; the caller owns translation and any toast.
 *
 * A focused button's changed name is often not read aloud, so a visually
 * hidden status region beside the button announces `copiedLabel`.
 */

import { Check, Copy } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const COPIED_MS = 2000
const BURST_MS = 1000
const BURST_DOTS = 8
const BURST_RADIUS_PX = 22

type CopyButtonProps = Omit<React.ComponentProps<"button">, "value" | "children"> & {
  value: string
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
  icon?: React.ReactNode
  copiedIcon?: React.ReactNode
  /** The accessible name while idle. An `aria-label` prop overrides both names. */
  label?: string
  /** The accessible name for two seconds after a copy. */
  copiedLabel?: string
  /** Text tilted above the button during the burst. Omit for dots only. */
  burstLabel?: React.ReactNode
  /** `false` turns the burst off. */
  burst?: boolean
  /** Runs once after the value is copied. Not called on failure. */
  onCopied?: () => void
  /** Runs when the copy fails. Without it the error goes to `console.error`. */
  onCopyError?: (error: unknown) => void
  tooltipLabel?: React.ReactNode
  copiedTooltipLabel?: React.ReactNode
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function animate(
  element: HTMLElement | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  // jsdom and very old browsers have no Web Animations API.
  if (element && typeof element.animate === "function") {
    element.animate(keyframes, options)
  }
}

function CopyBurst({ label }: { label?: React.ReactNode }) {
  const dots = React.useRef<(HTMLSpanElement | null)[]>([])
  const text = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    dots.current.forEach((dot, index) => {
      const angle = (index / BURST_DOTS) * 2 * Math.PI - Math.PI / 2
      const x = Math.cos(angle) * BURST_RADIUS_PX
      const y = Math.sin(angle) * BURST_RADIUS_PX
      animate(
        dot,
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${x}px, ${y}px) scale(0.2)`, opacity: 0 },
        ],
        { duration: BURST_MS * 0.7, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" },
      )
    })
    animate(
      text.current,
      [
        { transform: "translate(-50%, 4px) rotate(-10deg) scale(0.6)", opacity: 0 },
        { transform: "translate(-50%, -4px) rotate(-10deg) scale(1.05)", opacity: 1, offset: 0.3 },
        { transform: "translate(-50%, -10px) rotate(-10deg) scale(1)", opacity: 0 },
      ],
      { duration: BURST_MS, easing: "ease-out", fill: "forwards" },
    )
  }, [])

  return (
    <span
      aria-hidden="true"
      data-slot="copy-button-burst"
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {Array.from({ length: BURST_DOTS }, (_, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed set of dots that never reorders
          key={index}
          ref={(node) => {
            dots.current[index] = node
          }}
          className="absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full bg-primary opacity-0"
        />
      ))}
      {label === undefined || label === null || label === "" ? null : (
        <span
          ref={text}
          data-slot="copy-button-burst-label"
          className="absolute bottom-full left-1/2 text-xs font-semibold whitespace-nowrap text-primary opacity-0"
        >
          {label}
        </span>
      )}
    </span>
  )
}

function copyWithTextarea(value: string, host: HTMLElement) {
  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "absolute"
  textarea.style.left = "-9999px"
  // Beside the button, not on <body>: a focus trap (a dialog) would pull focus back and drop the selection.
  host.appendChild(textarea)

  const selection = document.getSelection()
  const selectedRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  textarea.focus()
  textarea.setSelectionRange(0, textarea.value.length)
  // execCommand reports failure by returning false; it does not throw.
  const copied = document.execCommand("copy")
  textarea.remove()

  if (selectedRange && selection) {
    selection.removeAllRanges()
    selection.addRange(selectedRange)
  }

  if (!copied) {
    throw new Error('execCommand("copy") failed')
  }
}

function CopyButton({
  value,
  className,
  size = "icon",
  variant = "ghost",
  icon,
  copiedIcon,
  label = "Copy",
  copiedLabel = "Copied",
  burstLabel,
  burst = true,
  onCopied,
  onCopyError,
  tooltipLabel,
  copiedTooltipLabel,
  onClick: userOnClick,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)
  // Each copy restarts the copied window, even while it is already showing.
  const [copyCount, setCopyCount] = React.useState(0)
  const [burstId, setBurstId] = React.useState(0)
  const [tooltipOpen, setTooltipOpen] = React.useState(false)

  React.useEffect(() => {
    if (copyCount === 0) return
    const timeout = setTimeout(() => setHasCopied(false), COPIED_MS)
    return () => clearTimeout(timeout)
  }, [copyCount])

  React.useEffect(() => {
    if (burstId === 0) return
    const timeout = setTimeout(() => setBurstId(0), BURST_MS)
    return () => clearTimeout(timeout)
  }, [burstId])

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    userOnClick?.(event)
    if (event.defaultPrevented) return
    const host = event.currentTarget.parentElement ?? document.body
    try {
      const canUseClipboardApi =
        typeof navigator !== "undefined" &&
        "clipboard" in navigator &&
        window.isSecureContext

      if (canUseClipboardApi) {
        await navigator.clipboard.writeText(value)
      } else {
        copyWithTextarea(value, host)
      }

      setHasCopied(true)
      setCopyCount((count) => count + 1)
      if (burst && !prefersReducedMotion()) {
        setBurstId((id) => id + 1)
      }
      onCopied?.()
    } catch (error) {
      if (onCopyError) {
        onCopyError(error)
      } else {
        console.error("Failed to copy:", error)
      }
    }
  }

  const button = (
    <Button
      type="button"
      size={size}
      variant={variant}
      aria-label={hasCopied ? copiedLabel : label}
      data-slot="copy-button"
      data-copied={hasCopied}
      {...props}
      className={cn(
        "relative",
        hasCopied && "text-green-600 dark:text-green-400",
        className,
      )}
      onClick={handleCopy}
    >
      {hasCopied
        ? (copiedIcon ?? <Check className="size-4" />)
        : (icon ?? <Copy className="size-4" />)}
      {burstId > 0 ? <CopyBurst key={burstId} label={burstLabel} /> : null}
    </Button>
  )

  // Rendered empty from the start: a live region added together with its text is not announced.
  // Placed before the button so the button stays a parent's last child (ButtonGroup corners, space-x).
  const status = (
    <span role="status" aria-live="polite" data-slot="copy-button-status" className="sr-only">
      {hasCopied ? copiedLabel : ""}
    </span>
  )

  if (tooltipLabel === undefined && copiedTooltipLabel === undefined) {
    return (
      <>
        {status}
        {button}
      </>
    )
  }

  const activeTooltip = hasCopied
    ? (copiedTooltipLabel ?? tooltipLabel)
    : (tooltipLabel ?? copiedTooltipLabel)

  return (
    <TooltipProvider>
      {status}
      {/* Controlled: the trigger closes the tooltip on click, which would hide the copied label. */}
      <Tooltip open={tooltipOpen || hasCopied} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{activeTooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

type CopyableCodeProps = Pick<
  CopyButtonProps,
  | "icon"
  | "copiedIcon"
  | "label"
  | "copiedLabel"
  | "burstLabel"
  | "burst"
  | "onCopied"
  | "onCopyError"
  | "tooltipLabel"
  | "copiedTooltipLabel"
> & {
  code: string
  /** The element that holds the code, such as `"h1"` for a page title. */
  as?: React.ElementType
  className?: string
  /** Set on the code element; the button gets `<id>-copy`. */
  "data-testid"?: string
}

/**
 * The copy button stays hidden until the code is hovered or holds focus,
 * stays visible while it shows the copied state, and is always visible on a
 * screen that cannot hover.
 */
function CopyableCode({
  code,
  as: Code = "span",
  className,
  "data-testid": testId,
  icon,
  copiedIcon,
  ...buttonProps
}: CopyableCodeProps) {
  // A heading cannot sit inside a span.
  const Root = Code === "span" ? "span" : "div"
  return (
    <Root
      data-slot="copyable-code"
      className={cn("group/code inline-flex min-w-0 items-center gap-0.5", className)}
    >
      <Code className="truncate tabular-nums" data-testid={testId}>
        {code}
      </Code>
      <CopyButton
        value={code}
        icon={icon ?? <Copy className="size-3.5" />}
        copiedIcon={copiedIcon ?? <Check className="size-3.5" />}
        data-testid={testId ? `${testId}-copy` : undefined}
        className="size-6 shrink-0 opacity-0 group-hover/code:opacity-100 group-focus-within/code:opacity-100 focus-visible:opacity-100 data-[copied=true]:opacity-100 [@media(hover:none)]:opacity-100"
        {...buttonProps}
      />
    </Root>
  )
}

export { CopyButton, CopyableCode }
export type { CopyButtonProps, CopyableCodeProps }
