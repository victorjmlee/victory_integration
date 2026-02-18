import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, error: "OPENAI_API_KEY not configured in .env.local. An Admin API Key is required for usage data." },
      { status: 200 }
    );
  }

  try {
    // Get usage for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const res = await fetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${Math.floor(startDate.getTime() / 1000)}&end_time=${Math.floor(endDate.getTime() / 1000)}&bucket_width=1d`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
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
            ? "OpenAI Admin API Key required. Regular API keys cannot access usage data. Go to Settings > Organization > Admin keys."
            : `OpenAI API error: ${res.status} - ${errorData}`,
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const buckets = data.data ?? [];

    let totalTokens = 0;
    const dailyUsage = buckets.map((bucket: { start_time: number; results?: Array<{ input_tokens: number; output_tokens: number }> }) => {
      const date = formatDate(new Date(bucket.start_time * 1000));
      const results = bucket.results ?? [];
      const inputTokens = results.reduce((sum: number, r: { input_tokens: number }) => sum + (r.input_tokens ?? 0), 0);
      const outputTokens = results.reduce((sum: number, r: { output_tokens: number }) => sum + (r.output_tokens ?? 0), 0);
      totalTokens += inputTokens + outputTokens;
      return { date, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
    });

    return NextResponse.json({ dailyUsage, totalTokens });
  } catch (err) {
    return NextResponse.json(
      { dailyUsage: [], totalTokens: 0, error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
