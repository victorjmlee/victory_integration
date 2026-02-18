import { NextRequest, NextResponse } from "next/server";

interface UsageResult {
  uncached_input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: { ephemeral_1h_input_tokens?: number; ephemeral_5m_input_tokens?: number };
  model?: string | null;
}

interface UsageBucket {
  starting_at: string;
  results: UsageResult[];
}

interface CostBucket {
  starting_at: string;
  results: Array<{ amount: string }>;
}

// Pricing per million tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-4-6": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-opus-4": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-sonnet-4-5": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-sonnet-4": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-4-5": { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
  "claude-3-haiku": { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.3 },
};

function matchPricing(modelId: string): { input: number; output: number; cacheRead: number; cacheWrite: number } {
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelId.includes(key)) return pricing;
  }
  return { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }; // default to sonnet pricing
}

function estimateCostForResult(r: UsageResult): number {
  if (!r.model) return 0;
  const pricing = matchPricing(r.model);
  const uncachedIn = r.uncached_input_tokens ?? 0;
  const cacheRead = r.cache_read_input_tokens ?? 0;
  const cacheWrite = (r.cache_creation?.ephemeral_1h_input_tokens ?? 0) + (r.cache_creation?.ephemeral_5m_input_tokens ?? 0);
  const output = r.output_tokens ?? 0;
  return (
    uncachedIn * pricing.input +
    cacheRead * pricing.cacheRead +
    cacheWrite * pricing.cacheWrite +
    output * pricing.output
  ) / 1_000_000;
}

function friendlyModelName(model: string): string {
  if (model.includes("opus-4-6")) return "Claude Opus 4.6";
  if (model.includes("opus-4")) return "Claude Opus 4";
  if (model.includes("sonnet-4-5")) return "Claude Sonnet 4.5";
  if (model.includes("sonnet-4")) return "Claude Sonnet 4";
  if (model.includes("haiku-4-5")) return "Claude Haiku 4.5";
  if (model.includes("3-haiku")) return "Claude Haiku 3";
  if (model.includes("3-5-sonnet")) return "Claude Sonnet 3.5";
  return model;
}

/** Estimate per-model costs from token usage, then scale so they sum to actualTotal. */
function buildModelCosts(results: UsageResult[], actualTotal: number): { model: string; cost: number }[] {
  const estimatedByModel = new Map<string, number>();
  for (const r of results) {
    if (!r.model) continue;
    const name = friendlyModelName(r.model);
    const est = estimateCostForResult(r);
    estimatedByModel.set(name, (estimatedByModel.get(name) ?? 0) + est);
  }
  const estimatedTotal = Array.from(estimatedByModel.values()).reduce((s, v) => s + v, 0);
  const scale = estimatedTotal > 0 ? actualTotal / estimatedTotal : 0;
  return Array.from(estimatedByModel.entries()).map(([model, est]) => ({ model, cost: est * scale }));
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, totalCost: 0, error: "ANTHROPIC_API_KEY not configured in .env.local. An Admin API Key (sk-ant-admin-...) is required." },
      { status: 200 }
    );
  }

  try {
    const { searchParams } = request.nextUrl;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    const endDate = endParam ? new Date(endParam) : new Date();
    const startDate = startParam ? new Date(startParam) : new Date(endDate.getTime() - 7 * 86400000);
    // The API returns buckets where ending_at < our ending_at param (strictly before).
    // Daily buckets end 1 day after they start, so we need +2 days to include the end date.
    const endDateExclusive = new Date(endDate.getTime() + 2 * 86400000);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = formatDate(new Date());
    const rangeIncludesToday = endDate >= new Date(todayStr);

    const startISO = `${formatDate(startDate)}T00:00:00Z`;
    const endISO = `${formatDate(endDateExclusive)}T00:00:00Z`;
    const todayStartISO = `${todayStr}T00:00:00Z`;
    const tomorrowISO = `${formatDate(new Date(new Date(todayStr).getTime() + 86400000))}T00:00:00Z`;
    const headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };

    const fetches: Promise<Response>[] = [
      // Usage report grouped by model for per-model token breakdown
      fetch(
        `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${startISO}&ending_at=${endISO}&bucket_width=1d&limit=31&group_by[]=model`,
        { headers }
      ),
      // Cost report WITHOUT group_by for accurate totals
      fetch(
        `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${startISO}&ending_at=${endISO}&bucket_width=1d&limit=31`,
        { headers }
      ),
    ];

    // Fetch today's hourly usage grouped by model if the range includes today (daily buckets may not have it yet)
    if (rangeIncludesToday) {
      fetches.push(
        fetch(
          `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${todayStartISO}&ending_at=${tomorrowISO}&bucket_width=1h&limit=24&group_by[]=model`,
          { headers }
        )
      );
    }

    const [usageRes, costRes, todayUsageRes] = await Promise.all(fetches);

    if (!usageRes.ok) {
      const errorData = await usageRes.text();
      const isAdminKeyError = usageRes.status === 403 || usageRes.status === 401;
      return NextResponse.json(
        {
          dailyUsage: [], totalTokens: 0, totalCost: 0,
          error: isAdminKeyError
            ? "Anthropic Admin API Key required (sk-ant-admin-...). Regular API keys cannot access usage data. Generate one at console.anthropic.com > Settings > Admin API keys."
            : `Anthropic API error: ${usageRes.status} - ${errorData}`,
        },
        { status: 200 }
      );
    }

    const usageData = await usageRes.json();
    const usageBuckets: UsageBucket[] = usageData.data ?? [];

    // Build cost map by date - no group_by so each bucket has one result with the total
    const costMap = new Map<string, number>();
    if (costRes.ok) {
      const costData = await costRes.json();
      for (const bucket of (costData.data ?? []) as CostBucket[]) {
        const date = bucket.starting_at?.split("T")[0] ?? "";
        let dayCost = 0;
        for (const r of bucket.results ?? []) {
          dayCost += parseFloat(r.amount ?? "0") / 100;
        }
        costMap.set(date, (costMap.get(date) ?? 0) + dayCost);
      }
    }

    // Check if today is already in the daily buckets
    const hasTodayInDaily = usageBuckets.some((b) => b.starting_at?.split("T")[0] === todayStr);

    // Aggregate today's hourly data with per-model cost estimates
    let todayAggregated: { inputTokens: number; outputTokens: number; estimatedCost: number; results: UsageResult[] } | null = null;
    if (rangeIncludesToday && !hasTodayInDaily && todayUsageRes?.ok) {
      const todayData = await todayUsageRes.json();
      const hourlyBuckets: UsageBucket[] = todayData.data ?? [];
      let inputTokens = 0;
      let outputTokens = 0;
      let estimatedCost = 0;
      const allResults: UsageResult[] = [];
      for (const bucket of hourlyBuckets) {
        for (const r of bucket.results ?? []) {
          allResults.push(r);
          const uncachedIn = r.uncached_input_tokens ?? 0;
          const cacheReadIn = r.cache_read_input_tokens ?? 0;
          const cacheWriteIn = (r.cache_creation?.ephemeral_1h_input_tokens ?? 0) + (r.cache_creation?.ephemeral_5m_input_tokens ?? 0);
          const rOut = r.output_tokens ?? 0;
          inputTokens += uncachedIn + cacheReadIn + cacheWriteIn;
          outputTokens += rOut;
          estimatedCost += estimateCostForResult(r);
        }
      }
      if (inputTokens > 0 || outputTokens > 0) {
        todayAggregated = { inputTokens, outputTokens, estimatedCost, results: allResults };
      }
    }

    let totalTokens = 0;
    let totalCost = 0;
    const dailyUsage: Array<{ date: string; inputTokens: number; outputTokens: number; totalTokens: number; cost: number; modelCosts: { model: string; cost: number }[]; estimated?: boolean }> = usageBuckets.map((bucket) => {
      let inputTokens = 0;
      let outputTokens = 0;
      for (const r of bucket.results ?? []) {
        inputTokens += (r.uncached_input_tokens ?? 0) + (r.cache_read_input_tokens ?? 0)
          + (r.cache_creation?.ephemeral_1h_input_tokens ?? 0) + (r.cache_creation?.ephemeral_5m_input_tokens ?? 0);
        outputTokens += r.output_tokens ?? 0;
      }
      const date = bucket.starting_at?.split("T")[0] ?? "";
      const actualCost = costMap.get(date) ?? 0;
      // Estimate per-model cost proportions from tokens, normalize to actual total
      const modelCosts = buildModelCosts(bucket.results ?? [], actualCost);
      totalTokens += inputTokens + outputTokens;
      totalCost += actualCost;
      return { date, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, cost: actualCost, modelCosts };
    });

    // Append today's aggregated hourly data if it wasn't in the daily response
    if (todayAggregated) {
      const actualCost = costMap.get(todayStr);
      const cost = actualCost ?? todayAggregated.estimatedCost;
      const modelCosts = buildModelCosts(todayAggregated.results, cost);
      totalTokens += todayAggregated.inputTokens + todayAggregated.outputTokens;
      totalCost += cost;
      dailyUsage.push({
        date: todayStr,
        inputTokens: todayAggregated.inputTokens,
        outputTokens: todayAggregated.outputTokens,
        totalTokens: todayAggregated.inputTokens + todayAggregated.outputTokens,
        cost,
        modelCosts,
        estimated: actualCost == null,
      });
    }

    return NextResponse.json({ dailyUsage, totalTokens, totalCost });
  } catch (err) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, totalCost: 0, error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
