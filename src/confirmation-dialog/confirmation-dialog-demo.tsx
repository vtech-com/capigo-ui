/**
 * A simple confirmation and a typed one that asks for the phrase first.
 */

import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ConfirmationDialogDemo() {
  const [simple, setSimple] = useState(false)
  const [typed, setTyped] = useState(false)
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setSimple(true)}>Archive</Button>
      <Button variant="outline" onClick={() => setTyped(true)}>Delete</Button>
      <ConfirmationDialog
        open={simple}
        onOpenChange={setSimple}
        mode="simple"
        title="Archive board?"
        message="You can restore it later."
        confirmButtonText="Archive"
        onConfirm={() => {}}
      />
      <ConfirmationDialog
        open={typed}
        onOpenChange={setTyped}
        title="Delete board"
        message="All tasks on it are removed."
        confirmText="Sprint 12"
        confirmButtonText="Delete"
        onConfirm={() => {}}
      />
    </div>
  )
}
