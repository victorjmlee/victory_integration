import { formatNumber } from "@/lib/utils";
import type { DailyUsage } from "@/types/ai-usage";

interface TokenSummaryProps {
  data: DailyUsage[];
  days?: number;
  totalCost?: number;
}

export function TokenSummary({ data, days = 30, totalCost }: TokenSummaryProps) {
  if (data.length === 0) return null;

  const totalInput = data.reduce((sum, d) => sum + d.inputTokens, 0);
  const totalOutput = data.reduce((sum, d) => sum + d.outputTokens, 0);
  const total = totalInput + totalOutput;

  const today = data[data.length - 1];
  const yesterday = data.length > 1 ? data[data.length - 2] : null;
  const hasCost = (totalCost ?? 0) > 0;
  const hasEstimate = data.some((d) => d.estimated);

  return (
    <div className={`grid grid-cols-2 gap-3 ${hasCost ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
      <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
        <p className="text-xs text-zinc-500">Total ({days}d)</p>
        <p className="text-sm font-semibold text-zinc-100">{formatNumber(total)}</p>
      </div>
      <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
        <p className="text-xs text-zinc-500">Input</p>
        <p className="text-sm font-semibold text-zinc-100">{formatNumber(totalInput)}</p>
      </div>
      <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
        <p className="text-xs text-zinc-500">Output</p>
        <p className="text-sm font-semibold text-zinc-100">{formatNumber(totalOutput)}</p>
      </div>
      {hasCost && (
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
          <p className="text-xs text-zinc-500">Cost ({days}d){hasEstimate ? "*" : ""}</p>
          <p className="text-sm font-semibold text-yellow-400">${totalCost!.toFixed(2)}</p>
          {hasEstimate && <p className="text-[10px] text-zinc-600">*includes estimate</p>}
        </div>
      )}
      <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
        <p className="text-xs text-zinc-500">Today</p>
        <p className="text-sm font-semibold text-zinc-100">
          {today ? formatNumber(today.totalTokens) : "—"}
        </p>
        {yesterday && today && (
          <p className="text-xs text-zinc-500">
            vs {formatNumber(yesterday.totalTokens)} yesterday
          </p>
        )}
      </div>
    </div>
  );
}
