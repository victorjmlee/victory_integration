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

interface CostResult {
  amount: string;
  description?: string;
  workspace_id?: string | null;
}

interface CostBucket {
  starting_at: string;
  results: CostResult[];
}

interface Workspace {
  id: string;
  name: string;
}

// Pricing per million tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-4-6": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-opus-4": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-sonnet-4-5": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-sonnet-4": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
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
  if (model.includes("sonnet-4-6")) return "Claude Sonnet 4.6";
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
    const headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };

    const startISO = `${formatDate(startDate)}T00:00:00Z`;
    const endISO = `${formatDate(endDateExclusive)}T00:00:00Z`;

    // Fetch hourly data for the last 3 days to cover the ~1 day API reporting delay
    const recentDays = 3;
    const recentStart = new Date(Math.max(
      startDate.getTime(),
      endDate.getTime() - (recentDays - 1) * 86400000
    ));
    const recentStartISO = `${formatDate(recentStart)}T00:00:00Z`;
    const recentEndISO = `${formatDate(new Date(endDate.getTime() + 86400000))}T00:00:00Z`;

    // Batch API calls to avoid rate limits (admin API has low rate limits)
    const [usageRes, costRes] = await Promise.all([
      // Usage report grouped by model for per-model token breakdown
      fetch(
        `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${startISO}&ending_at=${endISO}&bucket_width=1d&limit=31&group_by[]=model`,
        { headers }
      ),
      // Cost report grouped by model + workspace — used for both per-day totals and breakdown summaries
      fetch(
        `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${startISO}&ending_at=${endISO}&bucket_width=1d&limit=31&group_by[]=description&group_by[]=workspace_id`,
        { headers }
      ),
    ]);

    const [hourlyRes, workspacesRes] = await Promise.all([
      // Hourly usage for recent days to fill gaps from API reporting delay
      fetch(
        `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${recentStartISO}&ending_at=${recentEndISO}&bucket_width=1h&limit=${recentDays * 24}&group_by[]=model`,
        { headers }
      ),
      // Workspace list for name mapping
      fetch(
        `https://api.anthropic.com/v1/organizations/workspaces?limit=100`,
        { headers }
      ),
    ]);

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

    // Parse cost report (grouped by description + workspace) and workspace names
    const costMap = new Map<string, number>();
    const workspaceNames = new Map<string, string>();
    const allCostResults: CostResult[] = [];

    if (workspacesRes?.ok) {
      const wsData = await workspacesRes.json();
      for (const ws of (wsData.data ?? []) as Workspace[]) {
        workspaceNames.set(ws.id, ws.name);
      }
    }

    if (costRes.ok) {
      const costData = await costRes.json();
      for (const bucket of (costData.data ?? []) as CostBucket[]) {
        const date = bucket.starting_at?.split("T")[0] ?? "";
        let dayCost = 0;
        for (const r of bucket.results ?? []) {
          dayCost += parseFloat(r.amount ?? "0") / 100;
          allCostResults.push(r);
        }
        costMap.set(date, (costMap.get(date) ?? 0) + dayCost);
      }
    }

    // Group hourly data by date, skipping dates already covered by daily buckets
    const dailyDates = new Set(usageBuckets.map((b) => b.starting_at?.split("T")[0] ?? ""));
    const hourlyByDate = new Map<string, { inputTokens: number; outputTokens: number; estimatedCost: number; results: UsageResult[] }>();
    if (hourlyRes?.ok) {
      const hourlyData = await hourlyRes.json();
      for (const bucket of (hourlyData.data ?? []) as UsageBucket[]) {
        const date = bucket.starting_at?.split("T")[0] ?? "";
        if (dailyDates.has(date)) continue;
        let entry = hourlyByDate.get(date);
        if (!entry) {
          entry = { inputTokens: 0, outputTokens: 0, estimatedCost: 0, results: [] };
          hourlyByDate.set(date, entry);
        }
        for (const r of bucket.results ?? []) {
          entry.results.push(r);
          const uncachedIn = r.uncached_input_tokens ?? 0;
          const cacheReadIn = r.cache_read_input_tokens ?? 0;
          const cacheWriteIn = (r.cache_creation?.ephemeral_1h_input_tokens ?? 0) + (r.cache_creation?.ephemeral_5m_input_tokens ?? 0);
          const rOut = r.output_tokens ?? 0;
          entry.inputTokens += uncachedIn + cacheReadIn + cacheWriteIn;
          entry.outputTokens += rOut;
          entry.estimatedCost += estimateCostForResult(r);
        }
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

    // Append dates that were missing from daily buckets but available in hourly data.
    // Use cost_report when available, otherwise estimate from token pricing.
    for (const [date, agg] of Array.from(hourlyByDate.entries()).sort()) {
      if (agg.inputTokens === 0 && agg.outputTokens === 0) continue;
      const actualCost = costMap.get(date);
      const cost = actualCost ?? agg.estimatedCost;
      const modelCosts = buildModelCosts(agg.results, cost);
      totalTokens += agg.inputTokens + agg.outputTokens;
      totalCost += cost;
      dailyUsage.push({
        date,
        inputTokens: agg.inputTokens,
        outputTokens: agg.outputTokens,
        totalTokens: agg.inputTokens + agg.outputTokens,
        cost,
        modelCosts,
        estimated: actualCost == null,
      });
    }

    // Build cost-by-model and cost-by-workspace from the grouped cost results
    const modelTotals = new Map<string, number>();
    const workspaceTotals = new Map<string, number>();

    for (const r of allCostResults) {
      const amount = parseFloat(r.amount ?? "0") / 100; // cents → dollars
      if (r.description) {
        const name = friendlyModelName(r.description);
        modelTotals.set(name, (modelTotals.get(name) ?? 0) + amount);
      }
      const wsName = r.workspace_id
        ? (workspaceNames.get(r.workspace_id) ?? r.workspace_id)
        : "Default";
      workspaceTotals.set(wsName, (workspaceTotals.get(wsName) ?? 0) + amount);
    }

    const costByModel = Array.from(modelTotals.entries())
      .map(([model, cost]) => ({ model, cost }))
      .sort((a, b) => b.cost - a.cost);
    const costByWorkspace = Array.from(workspaceTotals.entries())
      .map(([workspace, cost]) => ({ workspace, cost }))
      .sort((a, b) => b.cost - a.cost);

    return NextResponse.json({ dailyUsage, totalTokens, totalCost, costByModel, costByWorkspace });
  } catch (err) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, totalCost: 0, error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
