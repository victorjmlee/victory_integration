"use client";

import { useState } from "react";
import { Bot, Sparkles, Gem, Calendar } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ProviderCard } from "@/components/ai-usage/ProviderCard";
import { UsageChart } from "@/components/ai-usage/UsageChart";
import { CostChart } from "@/components/ai-usage/CostChart";
import { TokenSummary } from "@/components/ai-usage/TokenSummary";
import { Card } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useOpenAIUsage, useAnthropicUsage, useGeminiStatus } from "@/hooks/useAIUsage";
import { formatNumber } from "@/lib/utils";
import type { ConnectionStatus } from "@/types/common";

function formatDateParam(d: Date): string {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDateParam(d);
}

const PRESETS = [
  { label: "1d", days: 1 },
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

function getStatus(loading: boolean, error: string | null, apiError?: string): ConnectionStatus {
  if (loading) return "loading";
  if (error || apiError) {
    if (apiError?.includes("not configured")) return "disconnected";
    return "error";
  }
  return "connected";
}

export default function AIUsagePage() {
  const [startDate, setStartDate] = useState(daysAgo(7));
  const [endDate, setEndDate] = useState(formatDateParam(new Date()));
  const [activePreset, setActivePreset] = useState<number | null>(7);

  const openai = useOpenAIUsage(startDate, endDate);
  const anthropic = useAnthropicUsage(startDate, endDate);
  const gemini = useGeminiStatus();

  const daysDiff = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  );

  function handlePreset(days: number) {
    setStartDate(daysAgo(days));
    setEndDate(formatDateParam(new Date()));
    setActivePreset(days);
  }

  function handleStartChange(value: string) {
    setStartDate(value);
    setActivePreset(null);
  }

  function handleEndChange(value: string) {
    setEndDate(value);
    setActivePreset(null);
  }

  return (
    <PageShell
      title="AI Usage"
      description="Token usage and connection status for AI providers"
    >
      <div className="space-y-6">
        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Presets */}
          <div className="flex items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => handlePreset(p.days)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activePreset === p.days
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-zinc-700" />

          {/* Date Pickers */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-zinc-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500"
            />
            <span className="text-xs text-zinc-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndChange(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* OpenAI Section */}
        {openai.loading ? (
          <CardSkeleton />
        ) : (
          <ProviderCard
            name="OpenAI"
            icon={<Bot size={18} className="text-emerald-400" />}
            status={getStatus(openai.loading, openai.error, openai.data?.error)}
            totalTokens={openai.data?.totalTokens}
            error={openai.data?.error}
          >
            {openai.data && !openai.data.error && (
              <>
                <TokenSummary data={openai.data.dailyUsage} days={daysDiff} totalCost={openai.data.totalCost} />
                <div className="mt-4 space-y-4">
                  <CostChart data={openai.data.dailyUsage} />
                  <UsageChart
                    title="Daily Token Usage"
                    data={openai.data.dailyUsage}
                    color="#10b981"
                  />
                </div>
              </>
            )}
          </ProviderCard>
        )}

        {/* Anthropic Section */}
        {anthropic.loading ? (
          <CardSkeleton />
        ) : (
          <ProviderCard
            name="Anthropic"
            icon={<Sparkles size={18} className="text-orange-400" />}
            status={getStatus(anthropic.loading, anthropic.error, anthropic.data?.error)}
            totalTokens={anthropic.data?.totalTokens}
            error={anthropic.data?.error}
          >
            {anthropic.data && !anthropic.data.error && (
              <>
                <TokenSummary data={anthropic.data.dailyUsage} days={daysDiff} totalCost={anthropic.data.totalCost} />
                <div className="mt-4 space-y-4">
                  <CostChart data={anthropic.data.dailyUsage} />
                  <UsageChart
                    title="Daily Token Usage"
                    data={anthropic.data.dailyUsage}
                    color="#f97316"
                  />
                </div>
              </>
            )}
          </ProviderCard>
        )}

        {/* Gemini Section */}
        {gemini.loading ? (
          <CardSkeleton />
        ) : (
          <ProviderCard
            name="Google Gemini"
            icon={<Gem size={18} className="text-blue-400" />}
            status={getStatus(gemini.loading, gemini.error, gemini.data?.error)}
            error={gemini.data?.error}
          >
            {gemini.data?.connected && gemini.data.models.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400 mb-3">
                  Usage API is not available for Gemini. Showing available models instead.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {gemini.data.models.slice(0, 8).map((model) => (
                    <Card key={model.name} className="p-3">
                      <p className="text-xs font-medium text-zinc-200">
                        {model.displayName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        In: {formatNumber(model.inputTokenLimit)} / Out:{" "}
                        {formatNumber(model.outputTokenLimit)}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </ProviderCard>
        )}
      </div>
    </PageShell>
  );
}
