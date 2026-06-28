import Link from "next/link";
import { cn } from "@/lib/utils";
import { Money } from "@/components/Money";

export function DebtTabs({
  dir,
  receivableTotal,
  payableTotal,
}: {
  dir: string;
  receivableTotal: number;
  payableTotal: number;
}) {
  const tabs = [
    { key: "receivable", label: "Khách nợ mình", total: receivableTotal, tone: "income" as const },
    { key: "payable", label: "Mình nợ", total: payableTotal, tone: "expense" as const },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`/debts?dir=${t.key}`}
          className={cn(
            "rounded-lg border p-3 text-center transition-colors",
            dir === t.key ? "border-primary bg-muted" : "border-border hover:bg-muted/50",
          )}
        >
          <span className="block text-xs text-muted-foreground">{t.label}</span>
          <Money amount={t.total} tone={t.tone} className="mt-0.5 block text-base font-semibold" />
        </Link>
      ))}
    </div>
  );
}
