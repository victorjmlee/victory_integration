"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ProjectList } from "@/components/vercel/ProjectList";
import { DeploymentList } from "@/components/vercel/DeploymentList";

export default function VercelPage() {
  return (
    <PageShell
      title="Vercel"
      description="Your projects and deployment status"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">
            Projects
          </h2>
          <ProjectList />
        </div>
        <div>
          <DeploymentList />
        </div>
      </div>
    </PageShell>
  );
}
