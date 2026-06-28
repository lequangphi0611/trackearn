import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

// Con số là nhân vật chính: luôn tabular (cột tiền thẳng), màu theo thu/chi.
export function Money({
  amount,
  tone,
  signed,
  className,
}: {
  amount: number;
  tone?: "income" | "expense";
  signed?: boolean;
  className?: string;
}) {
  const color = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "";
  const sign = signed && tone ? (tone === "income" ? "+" : "−") : "";
  return (
    <span className={cn("font-mono tabular", color, className)}>
      {sign}
      {formatCurrency(amount)}
    </span>
  );
}
