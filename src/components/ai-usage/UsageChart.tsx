"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/utils";
import type { DailyUsage } from "@/types/ai-usage";

interface UsageChartProps {
  title: string;
  data: DailyUsage[];
  color: string;
}

export function UsageChart({ title, data, color }: UsageChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">{title}</h3>
        <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
          No usage data available
        </div>
      </Card>
    );
  }

  const formatDateLabel = (date: string) => {
    const [, m, d] = date.split("-").map(Number);
    return `${m}/${d}`;
  };

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#27272a" }}
          />
          <YAxis
            tickFormatter={(v: number) => formatNumber(v)}
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
            formatter={(value: number, name: string) => [
              formatNumber(value),
              name === "inputTokens" ? "Input" : "Output",
            ]}
            labelFormatter={(label) => {
              const [, m, d] = String(label).split("-").map(Number);
              return `Date: ${m}/${d}`;
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === "inputTokens" ? "Input Tokens" : "Output Tokens"
            }
            wrapperStyle={{ fontSize: "12px" }}
          />
          <Area
            type="monotone"
            dataKey="inputTokens"
            stackId="1"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="outputTokens"
            stackId="1"
            stroke={`${color}99`}
            fill={`${color}66`}
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
