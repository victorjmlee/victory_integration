"use client";

import { Bot, Sparkles, Gem } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ProviderCard } from "@/components/ai-usage/ProviderCard";
import { UsageChart } from "@/components/ai-usage/UsageChart";
import { TokenSummary } from "@/components/ai-usage/TokenSummary";
import { Card } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useOpenAIUsage, useAnthropicUsage, useGeminiStatus } from "@/hooks/useAIUsage";
import { formatNumber } from "@/lib/utils";
import type { ConnectionStatus } from "@/types/common";

function getStatus(loading: boolean, error: string | null, apiError?: string): ConnectionStatus {
  if (loading) return "loading";
  if (error || apiError) {
    if (apiError?.includes("not configured")) return "disconnected";
    return "error";
  }
  return "connected";
}

export default function AIUsagePage() {
  const openai = useOpenAIUsage();
  const anthropic = useAnthropicUsage();
  const gemini = useGeminiStatus();

  return (
    <PageShell
      title="AI Usage"
      description="Token usage and connection status for AI providers"
    >
      <div className="space-y-6">
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
                <TokenSummary data={openai.data.dailyUsage} />
                <div className="mt-4">
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
                <TokenSummary data={anthropic.data.dailyUsage} />
                <div className="mt-4">
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
