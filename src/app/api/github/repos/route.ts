import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { repos: [], error: "GITHUB_TOKEN not configured in .env.local" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=30&affiliation=owner",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { repos: [], error: `GitHub API error: ${res.status} - ${errorText}` },
        { status: 200 }
      );
    }

    const repos = await res.json();
    return NextResponse.json({ repos });
  } catch (err) {
    return NextResponse.json(
      { repos: [], error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
