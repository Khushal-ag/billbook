"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/core/utils";

export type ReceivablesAgingChartRow = { name: string; amount: number };

/** Lazy-loaded with `next/dynamic` from `ReceivablesAgingSection` to defer recharts on the aging report. */
export function ReceivablesAgingBarChart({ chartRows }: { chartRows: ReceivablesAgingChartRow[] }) {
  return (
    <ChartContainer config={{}} className="h-[220px] w-full">
      <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tickLine={false} className="text-xs" />
        <YAxis
          tickLine={false}
          tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`}
          className="text-xs"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => String(label)}
            />
          }
        />
        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
