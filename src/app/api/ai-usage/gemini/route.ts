import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { connected: false, models: [], error: "GOOGLE_API_KEY not configured in .env.local" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      const errorData = await res.text();
      return NextResponse.json(
        { connected: false, models: [], error: `Gemini API error: ${res.status} - ${errorData}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    const models = (data.models ?? [])
      .filter((m: { name: string }) => m.name.includes("gemini"))
      .map((m: { name: string; displayName: string; description: string; inputTokenLimit?: number; outputTokenLimit?: number }) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        inputTokenLimit: m.inputTokenLimit ?? 0,
        outputTokenLimit: m.outputTokenLimit ?? 0,
      }));

    return NextResponse.json({ connected: true, models });
  } catch (err) {
    return NextResponse.json(
      { connected: false, models: [], error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
