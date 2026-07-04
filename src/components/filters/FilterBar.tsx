"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Khung bộ lọc cho các màn list: ô tìm kiếm luôn hiện; phần lọc chi tiết
 * (select/date + nút Lọc) mặc định THU GỌN trên mobile để dữ liệu không bị
 * đẩy xuống dưới fold — desktop (sm:) luôn mở như cũ. Đặt bên trong <form
 * method="get"> của từng màn; toggle chỉ là state client, không đổi URL.
 */
export function FilterBar({
  search,
  activeCount,
  children,
}: {
  /** Ô tìm kiếm (input trong form) — luôn hiện. */
  search: React.ReactNode;
  /** Số filter đang khác mặc định — hiện badge trên nút Lọc khi thu gọn. */
  activeCount: number;
  /** Các control lọc chi tiết + nút submit. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{search}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-expanded={open}
          aria-label={`Bộ lọc${activeCount > 0 ? ` (${activeCount} đang bật)` : ""}`}
          onClick={() => setOpen((o) => !o)}
          className={cn("relative shrink-0 sm:hidden", open && "bg-muted")}
        >
          <SlidersHorizontal className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand font-mono text-[10px] font-semibold text-brand-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>
      <div
        className={cn(
          "flex-col gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center",
          open ? "flex" : "hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
