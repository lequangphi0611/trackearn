import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { vnPeriodShift, type ReportPeriod } from "@/lib/date";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "month", label: "Tháng" },
  { key: "quarter", label: "Quý" },
  { key: "year", label: "Năm" },
];

/** Nhãn kỳ hiển thị: "Tháng 7/2026" · "Quý 3/2026" · "Năm 2026". */
export function periodLabel(period: ReportPeriod, dateISO: string): string {
  const [y, m] = dateISO.split("-").map(Number);
  if (period === "month") return `Tháng ${m}/${y}`;
  if (period === "quarter") return `Quý ${Math.floor((m - 1) / 3) + 1}/${y}`;
  return `Năm ${y}`;
}

/** Chọn loại kỳ + dời kỳ trước/sau — URL state (?period=&date=), server re-fetch. */
export function PeriodControls({
  period,
  date,
}: {
  period: ReportPeriod;
  date: string;
}) {
  const navBtn =
    "flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/reports?period=${p.key}&date=${date}`}
            aria-current={period === p.key ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1 text-center text-sm font-medium transition-colors",
              period === p.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <Link
          href={`/reports?period=${period}&date=${vnPeriodShift(period, date, -1)}`}
          aria-label="Kỳ trước"
          className={navBtn}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <span className="min-w-28 text-center text-sm font-medium">
          {periodLabel(period, date)}
        </span>
        <Link
          href={`/reports?period=${period}&date=${vnPeriodShift(period, date, 1)}`}
          aria-label="Kỳ sau"
          className={navBtn}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
