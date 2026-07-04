import Link from "next/link";
import { cn } from "@/lib/utils";
import { TRANSACTION_LINES } from "@/lib/transaction-lines";

type TransactionLineTabsProps = {
  // slug của mảng đang xem, hoặc null cho view tổng hợp "/transactions".
  active: string | null;
  // searchParams hiện tại — giữ from/to/type/status/q khi đổi tab (xem
  // tmp/reports-drilldown-implement.md §6 điểm 5), nhưng KHÔNG mang theo
  // categoryId/excludeCategoryId: 2 param này chỉ có nghĩa ở đúng mảng mà
  // link drill-down báo cáo trỏ tới (vd categoryId=cost_of_goods chỉ đúng
  // cho phụ kiện), mang sang mảng khác sẽ lọc sai mà không có dấu hiệu gì
  // trên UI cho biết đang bị lọc.
  searchParams: Record<string, string | undefined>;
};

const CARRIED_PARAMS = ["from", "to", "type", "status", "q"] as const;

/** Tab điều hướng nhanh giữa view tổng hợp và 4 màn giao dịch theo mảng. */
export function TransactionLineTabs({ active, searchParams }: TransactionLineTabsProps) {
  const qs = new URLSearchParams();
  for (const key of CARRIED_PARAMS) {
    const value = searchParams[key];
    if (value) qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs}` : "";

  const tabs = [
    { slug: null as string | null, label: "Tất cả", href: "/transactions" },
    ...TRANSACTION_LINES.map((l) => ({
      slug: l.slug as string | null,
      label: l.label,
      href: `/transactions/${l.slug}`,
    })),
  ];

  return (
    <nav
      aria-label="Chọn mảng giao dịch"
      className="flex gap-1 overflow-x-auto scroll-fade-x"
    >
      {tabs.map((t) => (
        <Link
          key={t.slug ?? "all"}
          href={`${t.href}${suffix}`}
          className={cn(
            // max-sm: tap target ≥40px (xem docs/rules/ui-design.md — quy ước
            // icon/menu-item 40px), desktop giữ mật độ nhỏ gọn cũ.
            "inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 max-sm:min-h-10 text-sm font-medium whitespace-nowrap transition-colors",
            active === t.slug
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
