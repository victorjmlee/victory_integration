import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return NextResponse.json(
      { projects: [], error: "VERCEL_TOKEN not configured in .env.local" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch("https://api.vercel.com/v10/projects?limit=20", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { projects: [], error: `Vercel API error: ${res.status} - ${errorText}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ projects: data.projects ?? [] });
  } catch (err) {
    return NextResponse.json(
      { projects: [], error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
