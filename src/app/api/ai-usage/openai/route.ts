import { NextRequest, NextResponse } from "next/server";

interface CostResult {
  amount: { value: string; currency: string };
  line_item: string | null;
}

function friendlyModelName(lineItem: string | null): string {
  if (!lineItem) return "Unknown";
  const model = lineItem.split(",")[0].trim();
  if (model.includes("gpt-4o-mini")) return "GPT-4o Mini";
  if (model.includes("gpt-4o")) return "GPT-4o";
  if (model.includes("gpt-4-turbo")) return "GPT-4 Turbo";
  if (model.includes("gpt-4")) return "GPT-4";
  if (model.includes("gpt-5-mini")) return "GPT-5 Mini";
  if (model.includes("gpt-5")) return "GPT-5";
  if (model.includes("o1-mini")) return "o1 Mini";
  if (model.includes("o1")) return "o1";
  if (model.includes("o3-mini")) return "o3 Mini";
  if (model.includes("o3")) return "o3";
  if (model.includes("dall-e")) return "DALL-E";
  return model;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, totalCost: 0, error: "OPENAI_API_KEY not configured in .env.local. An Admin API Key is required for usage data." },
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
    const startTs = Math.floor(startDate.getTime() / 1000);
    const endTs = Math.floor(endDateExclusive.getTime() / 1000);

    const [usageRes, costRes] = await Promise.all([
      fetch(
        `https://api.openai.com/v1/organization/usage/completions?start_time=${startTs}&end_time=${endTs}&bucket_width=1d&limit=31`,
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      ),
      fetch(
        `https://api.openai.com/v1/organization/costs?start_time=${startTs}&end_time=${endTs}&bucket_width=1d&limit=31&group_by=line_item`,
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      ),
    ]);

    if (!usageRes.ok) {
      const errorData = await usageRes.text();
      const isAdminKeyError = usageRes.status === 403 || usageRes.status === 401;
      return NextResponse.json(
        {
          dailyUsage: [], totalTokens: 0, totalCost: 0,
          error: isAdminKeyError
            ? "OpenAI Admin API Key required. Regular API keys cannot access usage data. Go to Settings > Organization > Admin keys."
            : `OpenAI API error: ${usageRes.status} - ${errorData}`,
        },
        { status: 200 }
      );
    }

    const usageData = await usageRes.json();
    const usageBuckets = usageData.data ?? [];

    // Build cost map by date with per-model breakdown
    const costMap = new Map<string, { total: number; models: Map<string, number> }>();
    if (costRes.ok) {
      const costData = await costRes.json();
      for (const bucket of costData.data ?? []) {
        const date = formatDate(new Date(bucket.start_time * 1000));
        const entry = costMap.get(date) ?? { total: 0, models: new Map<string, number>() };
        for (const r of (bucket.results ?? []) as CostResult[]) {
          const amountUsd = parseFloat(r.amount?.value ?? "0");
          const name = friendlyModelName(r.line_item);
          entry.total += amountUsd;
          entry.models.set(name, (entry.models.get(name) ?? 0) + amountUsd);
        }
        costMap.set(date, entry);
      }
    }

    let totalTokens = 0;
    let totalCost = 0;
    const dailyUsage = usageBuckets.map((bucket: { start_time: number; results?: Array<{ input_tokens: number; output_tokens: number }> }) => {
      const date = formatDate(new Date(bucket.start_time * 1000));
      const results = bucket.results ?? [];
      const inputTokens = results.reduce((sum: number, r: { input_tokens: number }) => sum + (r.input_tokens ?? 0), 0);
      const outputTokens = results.reduce((sum: number, r: { output_tokens: number }) => sum + (r.output_tokens ?? 0), 0);
      const costEntry = costMap.get(date);
      const cost = costEntry?.total ?? 0;
      const modelCosts = costEntry
        ? Array.from(costEntry.models.entries()).map(([model, c]) => ({ model, cost: c }))
        : [];
      totalTokens += inputTokens + outputTokens;
      totalCost += cost;
      return { date, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, cost, modelCosts };
    });

    return NextResponse.json({ dailyUsage, totalTokens, totalCost });
  } catch (err) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, totalCost: 0, error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
