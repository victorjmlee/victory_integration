import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils";
import type { VercelProject } from "@/types/vercel";

interface ProjectCardProps {
  project: VercelProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <a
            href={`https://vercel.com/~/projects/${project.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:underline"
          >
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {project.name}
            </h3>
            <ExternalLink size={12} className="shrink-0 text-zinc-500" />
          </a>
          {project.framework && (
            <p className="mt-1 text-xs text-zinc-400">{project.framework}</p>
          )}
        </div>
      </div>
      <div className="mt-3 text-xs text-zinc-500">
        Updated {formatRelativeTime(project.updatedAt)}
      </div>
    </Card>
  );
}
