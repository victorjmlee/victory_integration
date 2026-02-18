"use client";

import { PageShell } from "@/components/layout/PageShell";
import { OverviewGrid } from "@/components/dashboard/OverviewGrid";
import { QuickLinks } from "@/components/dashboard/QuickLinks";
import { useGitHubRepos } from "@/hooks/useGitHub";
import { useVercelProjects } from "@/hooks/useVercel";
import { useOpenAIUsage, useAnthropicUsage, useGeminiStatus } from "@/hooks/useAIUsage";
import type { ConnectionStatus } from "@/types/common";

function getConnectionStatus(
  loading: boolean,
  error: string | null,
  data: { error?: string } | null
): ConnectionStatus {
  if (loading) return "loading";
  if (error) return "error";
  if (data?.error?.includes("not configured")) return "disconnected";
  if (data?.error) return "error";
  return "connected";
}

export default function DashboardPage() {
  const github = useGitHubRepos();
  const vercel = useVercelProjects();
  const openai = useOpenAIUsage();
  const anthropic = useAnthropicUsage();
  const gemini = useGeminiStatus();

  const githubStatus = getConnectionStatus(github.loading, github.error, github.data);
  const vercelStatus = getConnectionStatus(vercel.loading, vercel.error, vercel.data);

  // AI overall status: connected if any provider is connected
  const aiStatuses = [
    getConnectionStatus(openai.loading, openai.error, openai.data),
    getConnectionStatus(anthropic.loading, anthropic.error, anthropic.data),
    getConnectionStatus(gemini.loading, gemini.error, gemini.data),
  ];
  const aiConnected = aiStatuses.filter((s) => s === "connected").length;
  const aiLoading = aiStatuses.some((s) => s === "loading");
  const aiOverallStatus: ConnectionStatus = aiLoading
    ? "loading"
    : aiConnected > 0
      ? "connected"
      : "disconnected";

  const isLoading = github.loading || vercel.loading;

  return (
    <PageShell
      title="Dashboard"
      description="Overview of all your integrations"
    >
      <div className="space-y-8">
        <OverviewGrid
          repoCount={github.data?.repos?.length ?? null}
          projectCount={vercel.data?.projects?.length ?? null}
          aiProviders={aiConnected}
          loading={isLoading}
        />
        <QuickLinks
          githubStatus={githubStatus}
          vercelStatus={vercelStatus}
          aiStatus={aiOverallStatus}
        />
      </div>
    </PageShell>
  );
}
