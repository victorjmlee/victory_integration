"use client";

import { GitCommit, GitBranch, GitPullRequest, Star, GitFork, Tag } from "lucide-react";
import { useGitHubEvents } from "@/hooks/useGitHub";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatRelativeTime, getEventDescription } from "@/lib/utils";
import type { GitHubEvent } from "@/types/github";

function getEventIcon(type: string) {
  switch (type) {
    case "PushEvent":
      return <GitCommit size={16} className="text-emerald-400" />;
    case "CreateEvent":
      return <GitBranch size={16} className="text-blue-400" />;
    case "PullRequestEvent":
      return <GitPullRequest size={16} className="text-violet-400" />;
    case "WatchEvent":
      return <Star size={16} className="text-yellow-400" />;
    case "ForkEvent":
      return <GitFork size={16} className="text-orange-400" />;
    case "ReleaseEvent":
      return <Tag size={16} className="text-pink-400" />;
    default:
      return <GitCommit size={16} className="text-zinc-400" />;
  }
}

function EventItem({ event }: { event: GitHubEvent }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 rounded-lg bg-zinc-800 p-1.5">
        {getEventIcon(event.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-200">
          {getEventDescription(event)}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">{event.repo.name}</span>
          {" · "}
          {formatRelativeTime(event.created_at)}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { data, error, loading } = useGitHubEvents();

  if (loading) return <ListSkeleton rows={5} />;

  if (error || data?.error) {
    const msg = data?.error ?? error ?? "Unknown error";
    return (
      <ErrorState
        message={msg}
        isTokenError={msg.includes("not configured")}
      />
    );
  }

  const events = data?.events ?? [];
  if (events.length === 0) {
    return <ErrorState message="No recent activity found." />;
  }

  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-zinc-300">Recent Activity</h3>
      <div className="divide-y divide-zinc-800">
        {events.slice(0, 15).map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </div>
    </Card>
  );
}
