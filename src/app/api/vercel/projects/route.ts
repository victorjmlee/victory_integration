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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projects = (data.projects ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      framework: p.framework ?? null,
      latestDeployments: p.latestDeployments,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      productionUrl: p.targets?.production?.alias?.[0]
        ?? p.alias?.[0]?.domain
        ?? (p.name ? `${p.name}.vercel.app` : undefined),
    }));
    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json(
      { projects: [], error: `Failed to fetch: ${(err as Error).message}` },
      { status: 200 }
    );
  }
}
