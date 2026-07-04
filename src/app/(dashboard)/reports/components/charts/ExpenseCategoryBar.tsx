"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE, compactCurrency } from "./chart-utils";

export type ExpenseCategoryDatum = { name: string; total: number };

/**
 * Bar ngang chi phí theo danh mục (giảm dần) — 1 măt đo, 1 màu (magnitude
 * qua độ dài), nhãn giá trị ở đầu bar.
 */
export function ExpenseCategoryBar({ data }: { data: ExpenseCategoryDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36 + 24)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 56, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeWidth={1} />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactCurrency}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          width={110}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatCurrency(Number(value)), "Chi phí"]}
        />
        <Bar
          dataKey="total"
          fill={CHART_COLORS.expense}
          maxBarSize={20}
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="total"
            position="right"
            formatter={(v) => compactCurrency(Number(v))}
            fill="var(--color-muted-foreground)"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
