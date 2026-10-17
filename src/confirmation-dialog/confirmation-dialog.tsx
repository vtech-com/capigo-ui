/**
 * A complete confirmation dialog on AlertDialog: a "simple" yes/no, or a
 * "typed" mode where the user must type a phrase first. The footer stays on
 * one row at every width, confirm last, because the upstream footer stacks
 * its buttons below `sm` and puts the primary action on top. Every label is a
 * prop; the caller owns translation.
 */

import { Check, Copy } from "lucide-react";
import type * as React from "react";
import { useId, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: React.ReactNode;
  mode?: "typed" | "simple";
  /** Required in typed mode. */
  confirmText?: string;
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  irreversibleWarningText?: string;
  typeToConfirmPrefixText?: string;
  typeToConfirmSuffixText?: string;
  copiedAriaLabel?: string;
  copyConfirmTextAriaLabel?: string;
  inputLabel?: string;
  inputAriaLabel?: string;
  escHintText?: string;
  /** Return false to keep the dialog open. Throwing also keeps it open. */
  // biome-ignore lint/suspicious/noConfusingVoidType: callers pass handlers that return nothing
  onConfirm: () => Promise<void | boolean> | void | boolean;
  confirmVariant?: "default" | "destructive";
  children?: React.ReactNode;
  confirmDisabled?: boolean;
  /** External pending state: disables both buttons. */
  busy?: boolean;
  contentTestId?: string;
  confirmTestId?: string;
  testIdPrefix?: string;
};

function ConfirmationDialog({
  open,
  onOpenChange,
  mode = "typed",
  title = "Delete",
  message,
  confirmText = "",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  irreversibleWarningText = mode === "typed"
    ? "This action cannot be undone."
    : undefined,
  typeToConfirmPrefixText = "Type",
  typeToConfirmSuffixText = "to confirm.",
  copiedAriaLabel = "Copied",
  copyConfirmTextAriaLabel = "Copy confirmation text",
  inputLabel = "Type confirmation text",
  inputAriaLabel = "Type confirmation text",
  escHintText = "Press ESC to cancel.",
  onConfirm,
  confirmVariant = mode === "typed" ? "destructive" : "default",
  children,
  confirmDisabled = false,
  busy = false,
  contentTestId = "confirmation-dialog",
  confirmTestId = "confirm-button",
  testIdPrefix,
}: ConfirmationDialogProps) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const normalizedConfirmText = useMemo(
    () => confirmText.trim(),
    [confirmText],
  );
  const typed = mode === "typed";
  const isMatch = !typed || value.trim() === normalizedConfirmText;
  const pending = submitting || busy;

  const handleConfirm = async () => {
    if (!isMatch || confirmDisabled || pending) return;
    try {
      setSubmitting(true);
      const result = await onConfirm();
      if (result === false) return;
      onOpenChange(false);
      setValue("");
    } catch (error) {
      console.error("Confirmation action failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return false;

    // Preferred API (will throw/deny if not allowed; fallback will still run)
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error("Failed to copy via clipboard API", error);
      }
    }

    // Fallback for insecure contexts or denied permissions
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);

      const selection = document.getSelection();
      const originalRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      textarea.select();
      const success = document.execCommand("copy");

      if (originalRange) {
        selection?.removeAllRanges();
        selection?.addRange(originalRange);
      } else {
        selection?.removeAllRanges();
      }

      document.body.removeChild(textarea);
      return success;
    } catch (error) {
      console.error("Failed to copy via fallback", error);
      return false;
    }
  };

  const handleCopy = async () => {
    if (!confirmText) return;
    const success = await copyToClipboard(confirmText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3600);
    } else {
      console.warn("Copy to clipboard was not successful");
    }
  };

  const cancelButton = (
    <AlertDialogCancel
      disabled={pending}
      data-testid={testIdPrefix ? `${testIdPrefix}-cancel` : undefined}
    >
      {cancelButtonText}
    </AlertDialogCancel>
  );
  const confirmButton = (
    <Button
      type="button"
      variant={confirmVariant}
      // Typed mode keeps its solid red: the shadcn destructive variant is only a tint, and other apps rely on this look.
      className={
        mode === "typed" && confirmVariant === "destructive"
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : undefined
      }
      onClick={handleConfirm}
      disabled={!isMatch || confirmDisabled || pending}
      data-testid={confirmTestId}
    >
      {confirmButtonText}
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={contentTestId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2 text-left text-sm">
              <div className="text-muted-foreground">{message}</div>
              {irreversibleWarningText ? (
                <p className="text-destructive font-medium">
                  {irreversibleWarningText}
                </p>
              ) : null}
              {typed ? (
                <div className="flex items-center gap-2">
                  <span>{typeToConfirmPrefixText}</span>
                  <span
                    data-testid="confirmation-text"
                    className="rounded-md bg-muted px-2 py-1 text-sm font-medium font-mono select-all"
                  >
                    {confirmText}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleCopy}
                    aria-label={
                      copied ? copiedAriaLabel : copyConfirmTextAriaLabel
                    }
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <span>{typeToConfirmSuffixText}</span>
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        {typed ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>{inputLabel}</Label>
            <Input
              id={inputId}
              data-testid="confirmation-input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={confirmText}
              aria-label={inputAriaLabel}
              disabled={pending}
            />
          </div>
        ) : null}

        <AlertDialogFooter
          className={cn(
            "flex-row items-center justify-end group-data-[size=sm]/alert-dialog-content:flex",
            typed && "justify-between",
          )}
        >
          {typed ? (
            <div className="min-w-0 text-xs text-muted-foreground">
              {escHintText}
            </div>
          ) : null}
          <div className="flex shrink-0 justify-end gap-2">
            {cancelButton}
            {confirmButton}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConfirmationDialog, type ConfirmationDialogProps };
