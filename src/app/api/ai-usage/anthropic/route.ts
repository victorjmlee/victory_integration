import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, error: "ANTHROPIC_API_KEY not configured in .env.local. An Admin API Key (sk-ant-admin-...) is required." },
      { status: 200 }
    );
  }

  try {
    // Get usage for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // Anthropic usage API (admin key required)
    const res = await fetch(
      `https://api.anthropic.com/v1/organizations/usage?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&granularity=day`,
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.text();
      const isAdminKeyError = res.status === 403 || res.status === 401;
      return NextResponse.json(
        {
          dailyUsage: [],
          totalTokens: 0,
          error: isAdminKeyError
            ? "Anthropic Admin API Key required (sk-ant-admin-...). Regular API keys cannot access usage data. Generate one at console.anthropic.com > Settings > Admin API keys."
            : `Anthropic API error: ${res.status} - ${errorData}`,
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const usageData = data.data ?? [];

    let totalTokens = 0;
    const dailyUsage = usageData.map((item: { date: string; input_tokens: number; output_tokens: number }) => {
      const inputTokens = item.input_tokens ?? 0;
      const outputTokens = item.output_tokens ?? 0;
      totalTokens += inputTokens + outputTokens;
      return {
        date: item.date,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      };
    });

    return NextResponse.json({ dailyUsage, totalTokens });
  } catch (err) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
