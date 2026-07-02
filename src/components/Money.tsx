import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

const bareFormatter = new Intl.NumberFormat("vi-VN");

// Con số là nhân vật chính: luôn tabular (cột tiền thẳng), màu theo thu/chi.
export function Money({
  amount,
  tone,
  signed,
  bare,
  className,
}: {
  amount: number;
  tone?: "income" | "expense";
  signed?: boolean;
  /** Bỏ hậu tố ₫ — cho bảng chật (₫ để ở header cột), tránh tiền wrap 2 dòng. */
  bare?: boolean;
  className?: string;
}) {
  const color = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "";
  const sign = signed && tone ? (tone === "income" ? "+" : "−") : "";
  return (
    <span className={cn("font-mono tabular", color, className)}>
      {sign}
      {bare ? bareFormatter.format(amount) : formatCurrency(amount)}
    </span>
  );
}
