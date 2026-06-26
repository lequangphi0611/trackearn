"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

const Menu = BaseMenu.Root;
const MenuTrigger = BaseMenu.Trigger;
const MenuSeparator = BaseMenu.Separator;

function MenuContent({
  className,
  children,
  side = "bottom",
  align = "start",
  ...props
}: React.ComponentProps<typeof BaseMenu.Popup> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={6} side={side} align={align} className="z-50">
        <BaseMenu.Popup
          className={cn(
            "min-w-44 rounded-lg border border-border bg-card p-1 shadow-md outline-none",
            "transition-all data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

function MenuItem({
  className,
  ...props
}: React.ComponentProps<typeof BaseMenu.Item>) {
  return (
    <BaseMenu.Item
      className={cn(
        "flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm outline-none select-none",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator };
