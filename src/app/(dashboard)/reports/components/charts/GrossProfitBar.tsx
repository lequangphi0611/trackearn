"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE, compactCurrency } from "./chart-utils";

export type GrossProfitDatum = { label: string; grossProfit: number };

/** Bar so sánh lãi gộp 3 mảng — màu theo dấu (lãi/lỗ), nhãn giá trị trên đỉnh. */
export function GrossProfitBar({ data }: { data: GrossProfitDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeWidth={1} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactCurrency}
          width={52}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatCurrency(Number(value)), "Lãi gộp"]}
        />
        <Bar dataKey="grossProfit" maxBarSize={24} radius={[4, 4, 0, 0]}>
          {/* Màu theo dấu (polarity): lãi = xanh thu, lỗ = đỏ chi. */}
          {data.map((d) => (
            <Cell
              key={d.label}
              fill={d.grossProfit >= 0 ? CHART_COLORS.income : CHART_COLORS.expense}
            />
          ))}
          <LabelList
            dataKey="grossProfit"
            position="top"
            formatter={(v) => compactCurrency(Number(v))}
            fill="var(--color-muted-foreground)"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
