"use client";

import { Rocket, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { useVercelDeployments } from "@/hooks/useVercel";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatRelativeTime, getDeploymentStatusColor } from "@/lib/utils";
import type { VercelDeployment } from "@/types/vercel";

function getStatusIcon(state: string) {
  switch (state) {
    case "READY":
      return <CheckCircle2 size={14} className="text-emerald-400" />;
    case "ERROR":
      return <XCircle size={14} className="text-red-400" />;
    case "BUILDING":
    case "INITIALIZING":
      return <Loader2 size={14} className="animate-spin text-yellow-400" />;
    case "QUEUED":
      return <Clock size={14} className="text-yellow-400" />;
    default:
      return <Rocket size={14} className="text-zinc-400" />;
  }
}

function DeploymentItem({ deployment }: { deployment: VercelDeployment }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5">{getStatusIcon(deployment.state)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-zinc-200">
            {deployment.name}
          </p>
          <span
            className={`text-xs font-medium ${getDeploymentStatusColor(deployment.state)}`}
          >
            {deployment.state}
          </span>
        </div>
        {deployment.meta?.githubCommitMessage && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {deployment.meta.githubCommitMessage}
          </p>
        )}
        <p className="mt-0.5 text-xs text-zinc-500">
          {formatRelativeTime(deployment.created)}
          {deployment.creator?.username &&
            ` by ${deployment.creator.username}`}
        </p>
      </div>
    </div>
  );
}

export function DeploymentList() {
  const { data, error, loading } = useVercelDeployments();

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

  const deployments = data?.deployments ?? [];
  if (deployments.length === 0) {
    return <ErrorState message="No deployments found." />;
  }

  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-zinc-300">
        Recent Deployments
      </h3>
      <div className="divide-y divide-zinc-800">
        {deployments.slice(0, 15).map((deployment) => (
          <DeploymentItem key={deployment.uid} deployment={deployment} />
        ))}
      </div>
    </Card>
  );
}
