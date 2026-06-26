"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { TRANSACTION_LINES } from "@/lib/transaction-lines";

// Việc #1 của app là nhập nhanh → nút nổi 1 chạm, chỉ trên mobile (desktop có nav).
export function QuickEntryFab() {
  return (
    <Menu>
      <MenuTrigger className="fixed right-5 bottom-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg ring-1 ring-black/5 transition-transform active:scale-95 sm:hidden">
        <Plus className="size-6" />
        <span className="sr-only">Nhập giao dịch</span>
      </MenuTrigger>
      <MenuContent side="top" align="end" className="mb-1">
        {TRANSACTION_LINES.map((l) => (
          <MenuItem key={l.slug} render={<Link href={`/transactions/${l.slug}/new`} />}>
            {l.label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
