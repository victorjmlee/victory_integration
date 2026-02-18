"use client";

import { FolderGit2, Rocket, Cpu } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface OverviewGridProps {
  repoCount: number | null;
  projectCount: number | null;
  aiProviders: number;
  loading: boolean;
}

export function OverviewGrid({
  repoCount,
  projectCount,
  aiProviders,
  loading,
}: OverviewGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="GitHub Repositories"
        value={repoCount ?? "—"}
        icon={<FolderGit2 size={20} />}
        href="/github"
      />
      <StatCard
        title="Vercel Projects"
        value={projectCount ?? "—"}
        icon={<Rocket size={20} />}
        href="/vercel"
      />
      <StatCard
        title="AI Providers"
        value={`${aiProviders}/3 connected`}
        icon={<Cpu size={20} />}
        href="/ai-usage"
      />
    </div>
  );
}
