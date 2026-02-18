"use client";

import { useVercelProjects } from "@/hooks/useVercel";
import { ProjectCard } from "./ProjectCard";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export function ProjectList() {
  const { data, error, loading } = useVercelProjects();

  if (loading) return <ListSkeleton rows={4} />;

  if (error || data?.error) {
    const msg = data?.error ?? error ?? "Unknown error";
    return (
      <ErrorState
        message={msg}
        isTokenError={msg.includes("not configured")}
      />
    );
  }

  const projects = data?.projects ?? [];
  if (projects.length === 0) {
    return <ErrorState message="No Vercel projects found." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
