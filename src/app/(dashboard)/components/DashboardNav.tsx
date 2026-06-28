"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; ownerOnly?: boolean };

// Phase 1: chỉ các route đã build. Mục mới thêm dần theo từng phase.
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tổng quan" },
  { href: "/settings", label: "Cài đặt" },
];

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.ownerOnly || role === "owner");

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
