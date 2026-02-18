import { NextRequest, NextResponse } from "next/server";

interface CostResult {
  amount: string;
  model: string | null;
  description: string | null;
}

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

// Pricing per million tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-opus-4": { input: 15, output: 75 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-sonnet-4": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 0.8, output: 4 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
};

function matchPricing(modelId: string): { input: number; output: number } {
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelId.includes(key)) return pricing;
  }
  return { input: 3, output: 15 }; // default to sonnet pricing
}

function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = matchPricing(modelId);
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

function friendlyModelName(model: string | null, description: string | null): string {
  if (description) {
    const match = description.match(/^(Claude .+?) Usage/);
    if (match) return match[1];
  }
  if (!model) return "Unknown";
  if (model.includes("opus-4-6")) return "Claude Opus 4.6";
  if (model.includes("opus-4")) return "Claude Opus 4";
  if (model.includes("sonnet-4-5")) return "Claude Sonnet 4.5";
  if (model.includes("sonnet-4")) return "Claude Sonnet 4";
  if (model.includes("haiku-4-5")) return "Claude Haiku 4.5";
  if (model.includes("3-haiku")) return "Claude Haiku 3";
  if (model.includes("3-5-sonnet")) return "Claude Sonnet 3.5";
  return model;
}

function sumBucketTokens(results: UsageResult[]): { inputTokens: number; outputTokens: number } {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const r of results) {
    inputTokens += (r.uncached_input_tokens ?? 0) + (r.cache_read_input_tokens ?? 0)
      + (r.cache_creation?.ephemeral_1h_input_tokens ?? 0) + (r.cache_creation?.ephemeral_5m_input_tokens ?? 0);
    outputTokens += r.output_tokens ?? 0;
  }
  return { inputTokens, outputTokens };
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
    // Add one day to end date since the API treats it as exclusive
    const endDateExclusive = new Date(endDate.getTime() + 86400000);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = formatDate(new Date());
    const rangeIncludesToday = endDate >= new Date(todayStr);

    const startISO = `${formatDate(startDate)}T00:00:00Z`;
    const endISO = `${formatDate(endDateExclusive)}T00:00:00Z`;
    const todayStartISO = `${todayStr}T00:00:00Z`;
    const tomorrowISO = `${formatDate(new Date(new Date(todayStr).getTime() + 86400000))}T00:00:00Z`;
    const headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };

    const fetches: Promise<Response>[] = [
      fetch(
        `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${startISO}&ending_at=${endISO}&bucket_width=1d&limit=31`,
        { headers }
      ),
      fetch(
        `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${startISO}&ending_at=${endISO}&bucket_width=1d&limit=31&group_by[]=description`,
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

    // Check if today is already in the daily buckets
    const hasTodayInDaily = usageBuckets.some((b) => b.starting_at?.split("T")[0] === todayStr);

    // Aggregate today's hourly data with per-model cost estimates
    let todayAggregated: { inputTokens: number; outputTokens: number; estimatedCost: number; modelCosts: Map<string, number> } | null = null;
    if (rangeIncludesToday && !hasTodayInDaily && todayUsageRes?.ok) {
      const todayData = await todayUsageRes.json();
      const hourlyBuckets: UsageBucket[] = todayData.data ?? [];
      let inputTokens = 0;
      let outputTokens = 0;
      let estimatedCost = 0;
      const modelCostsMap = new Map<string, number>();
      for (const bucket of hourlyBuckets) {
        for (const r of bucket.results ?? []) {
          const rIn = (r.uncached_input_tokens ?? 0) + (r.cache_read_input_tokens ?? 0)
            + (r.cache_creation?.ephemeral_1h_input_tokens ?? 0) + (r.cache_creation?.ephemeral_5m_input_tokens ?? 0);
          const rOut = r.output_tokens ?? 0;
          inputTokens += rIn;
          outputTokens += rOut;
          if (r.model) {
            const cost = estimateCost(r.model, rIn, rOut);
            estimatedCost += cost;
            const name = friendlyModelName(r.model, null);
            modelCostsMap.set(name, (modelCostsMap.get(name) ?? 0) + cost);
          }
        }
      }
      if (inputTokens > 0 || outputTokens > 0) {
        todayAggregated = { inputTokens, outputTokens, estimatedCost, modelCosts: modelCostsMap };
      }
    }

    // Build cost map by date with per-model breakdown (amounts in cents)
    const costMap = new Map<string, { total: number; models: Map<string, number> }>();
    if (costRes.ok) {
      const costData = await costRes.json();
      for (const bucket of costData.data ?? []) {
        const date = bucket.starting_at?.split("T")[0] ?? "";
        const entry = costMap.get(date) ?? { total: 0, models: new Map<string, number>() };
        for (const r of (bucket.results ?? []) as CostResult[]) {
          const amountUsd = parseFloat(r.amount ?? "0") / 100;
          const name = friendlyModelName(r.model, r.description);
          entry.total += amountUsd;
          entry.models.set(name, (entry.models.get(name) ?? 0) + amountUsd);
        }
        costMap.set(date, entry);
      }
    }

    let totalTokens = 0;
    let totalCost = 0;
    const dailyUsage: Array<{ date: string; inputTokens: number; outputTokens: number; totalTokens: number; cost: number; modelCosts: { model: string; cost: number }[]; estimated?: boolean }> = usageBuckets.map((bucket) => {
      const { inputTokens, outputTokens } = sumBucketTokens(bucket.results ?? []);
      const date = bucket.starting_at?.split("T")[0] ?? "";
      const costEntry = costMap.get(date);
      const cost = costEntry?.total ?? 0;
      const modelCosts = costEntry
        ? Array.from(costEntry.models.entries()).map(([model, c]) => ({ model, cost: c }))
        : [];
      totalTokens += inputTokens + outputTokens;
      totalCost += cost;
      return { date, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, cost, modelCosts };
    });

    // Append today's aggregated hourly data if it wasn't in the daily response
    if (todayAggregated) {
      // Use actual cost data if available, otherwise use estimated cost from token pricing
      const costEntry = costMap.get(todayStr);
      const cost = costEntry?.total ?? todayAggregated.estimatedCost;
      const modelCosts = costEntry
        ? Array.from(costEntry.models.entries()).map(([model, c]) => ({ model, cost: c }))
        : Array.from(todayAggregated.modelCosts.entries()).map(([model, c]) => ({ model, cost: c }));
      totalTokens += todayAggregated.inputTokens + todayAggregated.outputTokens;
      totalCost += cost;
      const hasCostFromApi = !!costMap.get(todayStr);
      dailyUsage.push({
        date: todayStr,
        inputTokens: todayAggregated.inputTokens,
        outputTokens: todayAggregated.outputTokens,
        totalTokens: todayAggregated.inputTokens + todayAggregated.outputTokens,
        cost,
        modelCosts,
        estimated: !hasCostFromApi,
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
