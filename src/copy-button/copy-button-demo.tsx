"use client"

/**
 * A plain copy button with a burst label, one with a tooltip, and an order
 * code as a page title with its copy button beside it.
 */

import { CopyableCode, CopyButton } from "@/components/copy-button"

export function CopyButtonDemo() {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-2">
        <code className="text-sm">npm install capigo-ui</code>
        <CopyButton value="npm install capigo-ui" burstLabel="Copied!" />
      </div>
      <CopyButton
        value="https://capigo.app/invite/7f3a"
        variant="outline"
        label="Copy invite link"
        copiedLabel="Invite link copied"
        tooltipLabel="Copy invite link"
        copiedTooltipLabel="Copied"
      />
      <CopyableCode
        code="PUT-2026-0042"
        as="h1"
        className="text-xl font-semibold tracking-tight"
        label="Copy plan code"
        copiedLabel="Plan code copied"
        burstLabel="Copied!"
      />
    </div>
  )
}
