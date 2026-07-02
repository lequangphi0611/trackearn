"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { vnAddDays } from "@/lib/date";

/** Chọn ngày xem dashboard — URL state (?date=), server re-fetch theo ngày. */
export function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const go = (d: string) => router.replace(`/?date=${d}`);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Ngày trước"
        onClick={() => go(vnAddDays(date, -1))}
      >
        <ChevronLeft />
      </Button>
      <Input
        type="date"
        aria-label="Chọn ngày"
        value={date}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="h-9 w-auto"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Ngày sau"
        onClick={() => go(vnAddDays(date, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
