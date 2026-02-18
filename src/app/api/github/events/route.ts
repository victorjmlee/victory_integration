import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;

  if (!token || !username) {
    return NextResponse.json(
      { events: [], error: "GITHUB_TOKEN or GITHUB_USERNAME not configured in .env.local" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/events?per_page=30`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { events: [], error: `GitHub API error: ${res.status} - ${errorText}` },
        { status: 200 }
      );
    }

    const events = await res.json();
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { events: [], error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
