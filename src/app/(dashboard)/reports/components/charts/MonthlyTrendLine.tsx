"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE, compactCurrency } from "./chart-utils";

export type TrendDatum = { month: string; revenue: number; profit: number };

const SERIES_LABELS: Record<string, string> = {
  revenue: "Doanh thu",
  profit: "Lãi",
};

/** "YYYY-MM" → "M/yy" cho tick trục hoành. */
function monthTick(month: string): string {
  const [y, m] = month.split("-");
  return `${Number(m)}/${y.slice(2)}`;
}

/** Line 12 tháng: doanh thu & lãi (accrual). 2 series → có legend + tooltip. */
export function MonthlyTrendLine({ data }: { data: TrendDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeWidth={1} />
        <XAxis
          dataKey="month"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          tickFormatter={monthTick}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactCurrency}
          width={52}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(label) => monthTick(String(label))}
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            SERIES_LABELS[String(name)] ?? String(name),
          ]}
        />
        {/* Nhãn legend dùng text token, không tô màu series lên chữ. */}
        <Legend
          formatter={(value) => (
            <span style={{ color: "var(--color-foreground)", fontSize: 12 }}>
              {SERIES_LABELS[String(value)] ?? String(value)}
            </span>
          )}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS.income}
          strokeWidth={2}
          strokeLinecap="round"
          dot={false}
          activeDot={{ r: 4, stroke: "var(--color-card)", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke={CHART_COLORS.accent}
          strokeWidth={2}
          strokeLinecap="round"
          dot={false}
          activeDot={{ r: 4, stroke: "var(--color-card)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
