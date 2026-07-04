// Tiện ích chung cho các chart island (/reports) — client only.

const compactFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Số tiền → dạng gọn cho tick/label ("1,2 Tr", "500 N"). */
export function compactCurrency(value: number): string {
  return compactFormatter.format(value);
}

// Token chart đã validate (scripts skill dataviz) cho cả light/dark.
export const CHART_COLORS = {
  income: "var(--color-chart-1)",
  expense: "var(--color-chart-2)",
  accent: "var(--color-chart-3)",
} as const;

export const AXIS_TICK = {
  fill: "var(--color-muted-foreground)",
  fontSize: 11,
} as const;

export const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--color-popover-foreground)",
} as const;
