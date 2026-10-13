"use client"

/**
 * A lifecycle status control: the current status as a dot plus a label, a
 * menu of the transitions allowed from it, and a chevron that takes the
 * happy-path transition without opening the menu. It owns presentation only;
 * the caller decides which transitions exist, what they are called, what they
 * look like and what happens when one is picked. `StatusPillBadge` is the
 * read-only form, and `StatusTransitionButton` the form for a status with one
 * transition.
 */

import * as React from "react"
import { ChevronRightIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type DataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined
}

type ButtonProps = React.ComponentProps<typeof Button>
type ButtonVariant = NonNullable<ButtonProps["variant"]>
type ButtonSize = NonNullable<ButtonProps["size"]>
type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>

/** Where a pick came from: a menu row or the chevron. */
type StatusSelectSource = "menu" | "quick"

interface StatusSplitPillStatus {
  /** Written to the label as `data-status` unless `labelProps` overrides it. */
  value: string
  label: React.ReactNode
  /** Colour of the dot, e.g. `bg-emerald-500`. */
  dotClassName?: string
  /** Applied to the label in the pill, and to the whole badge. */
  className?: string
}

interface StatusSplitPillConfirm {
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel: React.ReactNode
  cancelLabel: React.ReactNode
}

interface StatusSplitPillOption<T extends string = string> {
  /** Identifies the transition, not necessarily the target status. */
  value: T
  label: React.ReactNode
  dotClassName?: string
  className?: string
  /** A secondary word on the row's right, such as the action's verb. */
  verb?: React.ReactNode
  /** Red row with a red dot. */
  destructive?: boolean
  disabled?: boolean
  /** Disables the transition; read out on the row, shown as a tooltip on the chevron or button. */
  disabledReason?: React.ReactNode
  /** Ask before calling `onSelect`. */
  confirm?: StatusSplitPillConfirm
  testId?: string
}

interface StatusSplitPillClassNames {
  trigger?: string
  dot?: string
  label?: string
  spinner?: string
  content?: string
  menuLabel?: string
  item?: string
  itemDot?: string
  verb?: string
  quick?: string
  quickIcon?: string
  quickTooltipTrigger?: string
}

const DOT_BASE = "inline-block size-2 shrink-0 rounded-full"

function isOptionDisabled(option: StatusSplitPillOption<string>) {
  return Boolean(option.disabled || option.disabledReason)
}

function StatusDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="status-dot"
      className={cn(DOT_BASE, className)}
    />
  )
}

/** Holds the option awaiting confirmation and renders its dialog. */
function useStatusConfirm<T extends string>(
  onSelect: (value: T, source: StatusSelectSource) => void
) {
  const [awaiting, setAwaiting] = React.useState<{
    option: StatusSplitPillOption<T>
    source: StatusSelectSource
  } | null>(null)

  const choose = (
    option: StatusSplitPillOption<T>,
    source: StatusSelectSource
  ) => {
    if (option.confirm) {
      setAwaiting({ option, source })
      return
    }
    onSelect(option.value, source)
  }

  const confirm = awaiting?.option.confirm
  const dialog = (
    <AlertDialog
      open={awaiting !== null}
      onOpenChange={(open) => {
        if (!open) setAwaiting(null)
      }}
    >
      {confirm ? (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            {confirm.description ? (
              <AlertDialogDescription>
                {confirm.description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{confirm.cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              variant={awaiting?.option.destructive ? "destructive" : "default"}
              onClick={() => {
                if (awaiting) onSelect(awaiting.option.value, awaiting.source)
              }}
            >
              {confirm.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  )

  return { choose, dialog }
}

function DisabledReasonTooltip({
  reason,
  delay,
  className,
  children,
}: {
  reason: React.ReactNode
  delay: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{children}</span>
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface StatusSplitPillProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect" | "children"> {
  status: StatusSplitPillStatus
  /** Menu rows, in display order. */
  options: readonly StatusSplitPillOption<T>[]
  /** The option the chevron takes. None leaves the chevron disabled. */
  quickAction?: T | null
  onSelect: (value: T, source: StatusSelectSource) => void
  /** Disables the pill; `"menu"` or `"quick"` also shows a spinner there. */
  pending?: boolean | StatusSelectSource
  /** A heading above the menu rows. */
  menuLabel?: React.ReactNode
  /** Keep the menu open after a pick, e.g. while a pending spinner shows. */
  closeOnSelect?: boolean
  /** Button look of both halves; `"plain"` renders unstyled native buttons. */
  variant?: ButtonVariant | "plain"
  size?: ButtonSize
  /** Join the halves with `ButtonGroup` (`role="group"`); otherwise a plain span. */
  grouped?: boolean
  align?: "start" | "center" | "end"
  tooltipDelay?: number
  classNames?: StatusSplitPillClassNames
  triggerProps?: React.ComponentProps<"button"> & DataAttributes
  labelProps?: React.ComponentProps<"span"> & DataAttributes
  contentProps?: DataAttributes
  quickProps?: React.ComponentProps<"button"> & DataAttributes
  quickIcon?: React.ReactNode
}

function StatusSplitPill<T extends string = string>({
  status,
  options,
  quickAction = null,
  onSelect,
  pending = false,
  menuLabel,
  closeOnSelect = true,
  variant = "outline",
  size = "default",
  grouped = true,
  align = "start",
  tooltipDelay = 0,
  classNames,
  triggerProps,
  labelProps,
  contentProps,
  quickProps,
  quickIcon,
  className,
  ...props
}: StatusSplitPillProps<T>) {
  const { choose, dialog } = useStatusConfirm(onSelect)
  const busy = pending !== false
  const quickOption =
    quickAction === null
      ? undefined
      : options.find((option) => option.value === quickAction)
  const quickBlocked = quickOption ? isOptionDisabled(quickOption) : false
  const quickDisabled = busy || !quickOption || quickBlocked

  const renderButton = (
    buttonProps: React.ComponentProps<"button"> & DataAttributes
  ) =>
    variant === "plain" ? (
      <button type="button" {...buttonProps} />
    ) : (
      <Button variant={variant} size={size} {...buttonProps} />
    )

  const trigger = renderButton({
    ...triggerProps,
    disabled: busy || triggerProps?.disabled,
    className: cn(classNames?.trigger, triggerProps?.className),
    children: (
      <>
        <StatusDot className={cn(classNames?.dot, status.dotClassName)} />
        <span
          data-status={status.value}
          {...labelProps}
          className={cn(classNames?.label, status.className, labelProps?.className)}
        >
          {status.label}
        </span>
        {pending === "menu" ? (
          <Loader2Icon className={cn("animate-spin", classNames?.spinner)} />
        ) : null}
      </>
    ),
  })

  const quick = renderButton({
    ...quickProps,
    disabled: quickDisabled,
    onClick: () => {
      if (quickOption && !quickDisabled) choose(quickOption, "quick")
    },
    className: cn(classNames?.quick, quickProps?.className),
    children:
      pending === "quick" ? (
        <Loader2Icon className={cn("animate-spin", classNames?.spinner)} />
      ) : (
        (quickIcon ?? (
          <ChevronRightIcon
            aria-hidden="true"
            className={classNames?.quickIcon}
          />
        ))
      ),
  })

  const quickWithReason =
    quickBlocked && quickOption?.disabledReason ? (
      <DisabledReasonTooltip
        reason={quickOption.disabledReason}
        delay={tooltipDelay}
        className={cn(
          "inline-flex cursor-not-allowed",
          classNames?.quickTooltipTrigger
        )}
      >
        {quick}
      </DisabledReasonTooltip>
    ) : (
      quick
    )

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={classNames?.content}
        {...contentProps}
      >
        {menuLabel ? (
          <DropdownMenuLabel className={classNames?.menuLabel}>
            {menuLabel}
          </DropdownMenuLabel>
        ) : null}
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            data-testid={option.testId}
            disabled={isOptionDisabled(option)}
            variant={option.destructive ? "destructive" : "default"}
            onSelect={(event) => {
              if (!closeOnSelect) event.preventDefault()
              choose(option, "menu")
            }}
            className={cn(classNames?.item, option.className)}
          >
            <StatusDot
              className={cn(
                classNames?.itemDot,
                // A destructive row is red text; its dot follows the row, not the status.
                option.destructive ? "bg-destructive" : option.dotClassName
              )}
            />
            <span>{option.label}</span>
            {option.verb ? (
              <small
                className={cn(
                  "ml-auto pl-4 text-xs text-muted-foreground",
                  classNames?.verb
                )}
              >
                {option.verb}
              </small>
            ) : null}
            {option.disabledReason ? (
              <span className="sr-only">{option.disabledReason}</span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {grouped ? (
        <ButtonGroup className={className} {...props}>
          {menu}
          {quickWithReason}
        </ButtonGroup>
      ) : (
        <span
          data-slot="status-split-pill"
          className={className}
          {...props}
        >
          {menu}
          {quickWithReason}
        </span>
      )}
      {dialog}
    </>
  )
}

interface StatusPillBadgeProps
  extends Omit<React.ComponentProps<"span">, "children"> {
  status: StatusSplitPillStatus
  /** A `Badge` variant, or `"plain"` for an unstyled span. */
  variant?: BadgeVariant | "plain"
  dotClassName?: string
  labelProps?: React.ComponentProps<"span"> & DataAttributes
}

/** The read-only form: the same dot and label, with nothing to open. */
function StatusPillBadge({
  status,
  variant = "outline",
  dotClassName,
  labelProps,
  className,
  ...props
}: StatusPillBadgeProps) {
  const content = (
    <>
      <StatusDot className={cn(dotClassName, status.dotClassName)} />
      <span data-status={status.value} {...labelProps}>
        {status.label}
      </span>
    </>
  )
  if (variant === "plain") {
    return (
      <span
        data-slot="status-pill-badge"
        className={cn(status.className, className)}
        {...props}
      >
        {content}
      </span>
    )
  }
  return (
    <Badge
      variant={variant}
      className={cn(status.className, className)}
      {...props}
    >
      {content}
    </Badge>
  )
}

interface StatusTransitionButtonProps<T extends string = string>
  extends Omit<ButtonProps, "onSelect" | "onClick" | "children"> {
  /** The one transition; its `verb`, or else its `label`, is the button text. */
  option: StatusSplitPillOption<T>
  onSelect: (value: T) => void
  tooltipDelay?: number
  tooltipTriggerClassName?: string
}

/** The form for a status with exactly one transition: a single button. */
function StatusTransitionButton<T extends string = string>({
  option,
  onSelect,
  tooltipDelay = 0,
  tooltipTriggerClassName,
  disabled,
  ...props
}: StatusTransitionButtonProps<T>) {
  const { choose, dialog } = useStatusConfirm<T>((value) => onSelect(value))
  const blocked = isOptionDisabled(option)
  const button = (
    <Button
      type="button"
      data-testid={option.testId}
      variant={option.destructive ? "destructive" : "default"}
      {...props}
      disabled={disabled || blocked}
      onClick={() => choose(option, "quick")}
    >
      {option.verb ?? option.label}
    </Button>
  )

  return (
    <>
      {blocked && option.disabledReason ? (
        <DisabledReasonTooltip
          reason={option.disabledReason}
          delay={tooltipDelay}
          className={tooltipTriggerClassName}
        >
          {button}
        </DisabledReasonTooltip>
      ) : (
        button
      )}
      {dialog}
    </>
  )
}

export {
  StatusPillBadge,
  StatusSplitPill,
  StatusTransitionButton,
  type StatusPillBadgeProps,
  type StatusSelectSource,
  type StatusSplitPillClassNames,
  type StatusSplitPillConfirm,
  type StatusSplitPillOption,
  type StatusSplitPillProps,
  type StatusSplitPillStatus,
  type StatusTransitionButtonProps,
}
