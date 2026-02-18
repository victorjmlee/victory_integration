"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { DailyUsage } from "@/types/ai-usage";

interface CostChartProps {
  data: DailyUsage[];
}

const MODEL_COLORS: Record<string, string> = {
  // Anthropic
  "Claude Opus 4.6": "#e07a5f",
  "Claude Opus 4": "#e07a5f",
  "Claude Sonnet 4.5": "#f2b880",
  "Claude Sonnet 4": "#e8a87c",
  "Claude Haiku 4.5": "#81b29a",
  "Claude Haiku 3": "#b8c99d",
  // OpenAI
  "GPT-5": "#e07a5f",
  "GPT-5 Mini": "#f2b880",
  "GPT-4o": "#81b29a",
  "GPT-4o Mini": "#b8c99d",
  "GPT-4 Turbo": "#e8a87c",
  "GPT-4": "#d4a574",
  "o3": "#7facd6",
  "o3 Mini": "#a8c8e8",
  "o1": "#c9a8e8",
  "o1 Mini": "#d4bce8",
};

const FALLBACK_COLORS = ["#e07a5f", "#f2b880", "#81b29a", "#7facd6", "#c9a8e8", "#b8c99d", "#e8a87c", "#a8c8e8"];

export function CostChart({ data }: CostChartProps) {
  // Collect all unique models across all days
  const modelSet = new Set<string>();
  for (const d of data) {
    for (const mc of d.modelCosts ?? []) {
      modelSet.add(mc.model);
    }
  }
  const models = Array.from(modelSet);

  if (models.length === 0) {
    return (
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">Daily Token Cost</h3>
        <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
          No cost data available
        </div>
      </Card>
    );
  }

  const hasEstimated = data.some((d) => d.estimated);

  // Transform data: flatten modelCosts into top-level keys for recharts
  const chartData = data.map((d) => {
    const row: Record<string, string | number | boolean> = { date: d.date, estimated: !!d.estimated };
    for (const m of models) {
      row[m] = 0;
    }
    for (const mc of d.modelCosts ?? []) {
      row[mc.model] = Number((row[mc.model] as number || 0)) + mc.cost;
    }
    return row;
  });

  const formatDateLabel = (date: string) => {
    const [, m, d] = date.split("-").map(Number);
    return `${m}/${d}`;
  };

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-300">Daily Token Cost</h3>
        {hasEstimated && (
          <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
            Today&apos;s cost is estimated
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#27272a" }}
          />
          <YAxis
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#27272a" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
            labelFormatter={(label, payload) => {
              const [, m, d] = String(label).split("-").map(Number);
              const isEst = payload?.[0]?.payload?.estimated;
              return `Date: ${m}/${d}${isEst ? " (estimated)" : ""}`;
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          {models.map((model, i) => (
            <Bar
              key={model}
              dataKey={model}
              stackId="cost"
              fill={MODEL_COLORS[model] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              radius={i === models.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
