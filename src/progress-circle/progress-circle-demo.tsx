/**
 * The three sizes, a value label, and a caller recolouring the ring for an
 * overdue board.
 */

import { ProgressCircle } from "@/components/progress-circle"

export function ProgressCircleDemo() {
  return (
    <div className="flex items-center gap-4">
      <ProgressCircle value={20} size="sm" aria-label="Sprint progress" />
      <ProgressCircle value={55} showValue aria-label="Board progress" />
      <ProgressCircle value={90} size="lg" showValue aria-label="Release progress" />
      <ProgressCircle
        value={40}
        showValue
        aria-label="Overdue board progress"
        classNames={{
          track: "stroke-destructive/20",
          indicator: "stroke-destructive",
          value: "text-destructive",
        }}
      />
    </div>
  )
}
