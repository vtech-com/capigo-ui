/**
 * A small ring that reads a percentage at a glance, for a card or a table
 * cell where a bar would not fit. It owns presentation only: the caller
 * computes the percentage and names the bar with `aria-label`.
 */

import type * as React from "react"

import { cn } from "@/lib/utils"

const SIZES = {
  sm: { px: 14, stroke: 3, text: "text-xs" },
  default: { px: 18, stroke: 3, text: "text-sm" },
  lg: { px: 24, stroke: 4, text: "text-base" },
} as const

interface ProgressCircleClassNames {
  svg?: string
  track?: string
  indicator?: string
  value?: string
}

type ProgressCircleProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** A percentage; clamped to 0–100 and rounded. A non-finite value reads as 0. */
  value: number
  size?: keyof typeof SIZES
  showValue?: boolean
  classNames?: ProgressCircleClassNames
}

function ProgressCircle({
  className,
  classNames,
  value,
  size = "default",
  showValue = false,
  ...props
}: ProgressCircleProps) {
  const clamped = Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : 0
  const { px, stroke, text } = SIZES[size]
  const radius = (px - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = px / 2

  return (
    <span
      data-slot="progress-circle"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 tabular-nums",
        text,
        className
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        className={cn("-rotate-90", classNames?.svg)}
      >
        <circle
          data-slot="progress-circle-track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          className={cn("stroke-primary/20", classNames?.track)}
        />
        <circle
          data-slot="progress-circle-indicator"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn("stroke-primary", classNames?.indicator)}
        />
      </svg>
      {showValue ? (
        <span data-slot="progress-circle-value" className={classNames?.value}>
          {clamped}%
        </span>
      ) : null}
    </span>
  )
}

export { ProgressCircle, type ProgressCircleClassNames, type ProgressCircleProps }
