import { Star, GitFork, Circle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime, getLanguageColor } from "@/lib/utils";
import type { GitHubRepo } from "@/types/github";

interface RepoCardProps {
  repo: GitHubRepo;
}

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <Card hover>
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {repo.name}
            </h3>
            {repo.description && (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                {repo.description}
              </p>
            )}
          </div>
          <span className="ml-2 rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
            {repo.visibility}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          {repo.language && (
            <span className="flex items-center gap-1">
              <Circle
                size={8}
                fill={getLanguageColor(repo.language)}
                stroke="none"
              />
              {repo.language}
            </span>
          )}
          {repo.stargazers_count > 0 && (
            <span className="flex items-center gap-1">
              <Star size={12} />
              {repo.stargazers_count}
            </span>
          )}
          {repo.forks_count > 0 && (
            <span className="flex items-center gap-1">
              <GitFork size={12} />
              {repo.forks_count}
            </span>
          )}
          <span>Updated {formatRelativeTime(repo.updated_at)}</span>
        </div>

        {repo.topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {repo.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </a>
    </Card>
  );
}
