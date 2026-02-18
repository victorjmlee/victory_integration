"use client";

import { useGitHubRepos } from "@/hooks/useGitHub";
import { RepoCard } from "./RepoCard";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export function RepoList() {
  const { data, error, loading } = useGitHubRepos();

  if (loading) return <ListSkeleton rows={6} />;

  if (error || data?.error) {
    const msg = data?.error ?? error ?? "Unknown error";
    return (
      <ErrorState
        message={msg}
        isTokenError={msg.includes("not configured")}
      />
    );
  }

  const repos = data?.repos ?? [];
  if (repos.length === 0) {
    return <ErrorState message="No repositories found." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
