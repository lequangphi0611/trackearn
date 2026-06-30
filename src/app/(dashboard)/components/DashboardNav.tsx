"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { TRANSACTION_LINES } from "@/lib/transaction-lines";

function linkClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
  );
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    // Desktop dùng thanh ngang; mobile chuyển sang BottomNav (xem layout).
    <nav className="hidden items-center gap-1 sm:flex">
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={linkClass(pathname === "/")}
      >
        Tổng quan
      </Link>

      <Menu>
        <MenuTrigger
          className={cn(
            linkClass(pathname.startsWith("/transactions")),
            "inline-flex items-center gap-1",
          )}
        >
          Giao dịch
          <ChevronDown className="size-3.5" />
        </MenuTrigger>
        <MenuContent>
          {TRANSACTION_LINES.map((l) => (
            <MenuItem
              key={l.slug}
              render={<Link href={`/transactions/${l.slug}`} />}
            >
              {l.label}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>

      <Link href="/debts" className={linkClass(pathname.startsWith("/debts"))}>
        Công nợ
      </Link>
      <Link
        href="/kho"
        className={linkClass(
          pathname.startsWith("/kho") ||
            pathname.startsWith("/devices") ||
            pathname.startsWith("/spare-parts"),
        )}
      >
        Kho
      </Link>
    </nav>
  );
}
