"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Receipt, HandCoins, Settings, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { TRANSACTION_LINES } from "@/lib/transaction-lines";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
};

// 2 tab mỗi bên, nút "+" nhô giữa — vùng ngón cái với tới, mỗi mục 1 chạm.
const LEFT: Tab[] = [
  { href: "/", label: "Tổng quan", icon: House, match: (p) => p === "/" },
  {
    href: "/transactions",
    label: "Giao dịch",
    icon: Receipt,
    match: (p) => p.startsWith("/transactions"),
  },
];
const RIGHT: Tab[] = [
  {
    href: "/debts",
    label: "Công nợ",
    icon: HandCoins,
    match: (p) => p.startsWith("/debts"),
  },
  {
    href: "/settings",
    label: "Cài đặt",
    icon: Settings,
    match: (p) => p.startsWith("/settings"),
  },
];

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon
        className={cn("size-5", active && "text-brand")}
        strokeWidth={active ? 2.4 : 2}
      />
      <span className="leading-none">{tab.label}</span>
    </Link>
  );
}

// Nav dưới đáy — chỉ mobile. Desktop dùng thanh ngang (DashboardNav) ở header.
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="mx-auto flex h-16 w-full max-w-3xl items-stretch px-2">
        {LEFT.map((t) => (
          <TabLink key={t.href} tab={t} active={t.match(pathname)} />
        ))}

        {/* Nút nhập nhanh — việc #1 của app, nổi bật ở giữa. */}
        <div className="flex flex-1 items-start justify-center">
          <Menu>
            <MenuTrigger
              aria-label="Nhập giao dịch"
              className="-mt-5 flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"
            >
              <Plus className="size-6" />
            </MenuTrigger>
            <MenuContent side="top" align="center" className="mb-2">
              {TRANSACTION_LINES.map((l) => (
                <MenuItem
                  key={l.slug}
                  render={<Link href={`/transactions/${l.slug}/new`} />}
                >
                  {l.label}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        </div>

        {RIGHT.map((t) => (
          <TabLink key={t.href} tab={t} active={t.match(pathname)} />
        ))}
      </div>
    </nav>
  );
}
