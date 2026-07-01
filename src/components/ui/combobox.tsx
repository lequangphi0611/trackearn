"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";

import { cn } from "@/lib/utils";

const Combobox = BaseCombobox.Root;

function ComboboxInputGroup({
  className,
  ...props
}: React.ComponentProps<typeof BaseCombobox.InputGroup>) {
  return (
    <BaseCombobox.InputGroup
      className={cn(
        "flex h-9 w-full items-center gap-1 rounded-lg border border-input bg-background pr-1 pl-3 shadow-xs transition-colors",
        "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: React.ComponentProps<typeof BaseCombobox.Input>) {
  return (
    <BaseCombobox.Input
      className={cn(
        "h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxClear({
  className,
  ...props
}: Omit<React.ComponentProps<typeof BaseCombobox.Clear>, "children">) {
  return (
    <BaseCombobox.Clear
      aria-label="Xoá lựa chọn"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      <X className="size-3.5" />
    </BaseCombobox.Clear>
  );
}

function ComboboxTrigger({
  className,
  ...props
}: Omit<React.ComponentProps<typeof BaseCombobox.Trigger>, "children">) {
  return (
    <BaseCombobox.Trigger
      aria-label="Mở danh sách"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      <ChevronsUpDown className="size-4" />
    </BaseCombobox.Trigger>
  );
}

function ComboboxPopup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseCombobox.Popup>) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner sideOffset={6} className="z-50">
        <BaseCombobox.Popup
          className={cn(
            "w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-card p-1 shadow-md outline-none",
            "transition-all data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

function ComboboxEmpty({ className, ...props }: React.ComponentProps<typeof BaseCombobox.Empty>) {
  return (
    <BaseCombobox.Empty
      className={cn("px-3 py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxList({ className, ...props }: React.ComponentProps<typeof BaseCombobox.List>) {
  return (
    <BaseCombobox.List
      className={cn("flex max-h-64 flex-col gap-0.5 overflow-auto outline-none", className)}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseCombobox.Item>) {
  return (
    <BaseCombobox.Item
      className={cn(
        "grid cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        className,
      )}
      {...props}
    >
      <BaseCombobox.ItemIndicator className="col-start-1 text-primary">
        <Check className="size-3.5" />
      </BaseCombobox.ItemIndicator>
      <span className="col-start-2">{children}</span>
    </BaseCombobox.Item>
  );
}

export {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxClear,
  ComboboxTrigger,
  ComboboxPopup,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
};
