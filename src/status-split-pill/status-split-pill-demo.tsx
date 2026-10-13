"use client"

/**
 * Both looks of the pill on one order lifecycle: a compact outline group, and
 * an unstyled segmented box with a menu label, verbs, a destructive row, a
 * blocked transition and a confirm.
 */

import * as React from "react"

import {
  StatusPillBadge,
  StatusSplitPill,
  StatusTransitionButton,
  type StatusSplitPillOption,
} from "@/components/status-split-pill"

type OrderStatus = "draft" | "confirmed" | "shipped" | "cancelled"

const STATUS: Record<OrderStatus, { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-gray-400", text: "text-muted-foreground" },
  confirmed: { label: "Confirmed", dot: "bg-sky-500", text: "text-sky-600" },
  shipped: { label: "Shipped", dot: "bg-emerald-600", text: "text-emerald-600" },
  cancelled: { label: "Cancelled", dot: "bg-rose-500", text: "text-destructive" },
}

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: [],
  cancelled: [],
}

function pillStatus(status: OrderStatus) {
  return {
    value: status,
    label: STATUS[status].label,
    dotClassName: STATUS[status].dot,
    className: STATUS[status].text,
  }
}

export function StatusSplitPillDemo() {
  const [status, setStatus] = React.useState<OrderStatus>("draft")
  const options: StatusSplitPillOption<OrderStatus>[] = NEXT[status].map(
    (next) => ({
      value: next,
      label: STATUS[next].label,
      dotClassName: STATUS[next].dot,
      className: STATUS[next].text,
    })
  )

  const segmented: StatusSplitPillOption<OrderStatus>[] = NEXT[status].map(
    (next) => ({
      value: next,
      label: STATUS[next].label,
      dotClassName: STATUS[next].dot,
      verb: next === "cancelled" ? "Cancel" : "Advance",
      destructive: next === "cancelled",
      disabledReason:
        next === "shipped" ? "Add a tracking number first" : undefined,
      confirm:
        next === "cancelled"
          ? {
              title: "Cancel this order?",
              confirmLabel: "Cancel order",
              cancelLabel: "Keep",
            }
          : undefined,
    })
  )

  return (
    <div className="flex flex-col items-start gap-6">
      {options.length > 0 ? (
        <StatusSplitPill
          status={pillStatus(status)}
          options={options}
          quickAction={options[0]?.value ?? null}
          onSelect={setStatus}
          variant="outline"
          size="sm"
          classNames={{ trigger: "uppercase", content: "min-w-48" }}
        />
      ) : (
        <StatusPillBadge
          status={pillStatus(status)}
          variant="secondary"
          className="uppercase"
        />
      )}

      {segmented.length > 1 ? (
        <StatusSplitPill
          status={{ ...pillStatus(status), className: undefined }}
          options={segmented}
          quickAction={segmented[0]?.value ?? null}
          onSelect={setStatus}
          menuLabel="Change status"
          grouped={false}
          variant="plain"
          className="inline-flex h-8 items-stretch overflow-hidden rounded-lg border bg-card"
          classNames={{
            trigger:
              "inline-flex items-center gap-2 px-2.5 text-xs font-semibold uppercase hover:bg-muted aria-expanded:bg-muted",
            content: "min-w-60",
            menuLabel: "text-xs font-normal",
            item: "gap-2 py-1.5",
            quick:
              "inline-flex items-center border-l px-2 hover:bg-muted disabled:opacity-45",
            quickIcon: "size-4",
          }}
        />
      ) : segmented[0] ? (
        <StatusTransitionButton
          option={segmented[0]}
          onSelect={setStatus}
          size="sm"
        />
      ) : null}
    </div>
  )
}
