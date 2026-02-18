"use client";

import { PageShell } from "@/components/layout/PageShell";
import { RepoList } from "@/components/github/RepoList";
import { ActivityFeed } from "@/components/github/ActivityFeed";

export default function GitHubPage() {
  return (
    <PageShell
      title="GitHub"
      description="Your repositories and recent activity"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">
            Repositories
          </h2>
          <RepoList />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </PageShell>
  );
}
