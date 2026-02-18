"use client";

import Link from "next/link";
import { Github, Triangle, Brain, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ConnectionStatus } from "@/types/common";

interface QuickLinkProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  status: ConnectionStatus;
}

function QuickLink({ title, description, href, icon, status }: QuickLinkProps) {
  return (
    <Link href={href}>
      <Card hover>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-zinc-800 p-2.5">{icon}</div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
              <p className="text-xs text-zinc-400">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <ArrowRight size={16} className="text-zinc-600" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface QuickLinksProps {
  githubStatus: ConnectionStatus;
  vercelStatus: ConnectionStatus;
  aiStatus: ConnectionStatus;
}

export function QuickLinks({ githubStatus, vercelStatus, aiStatus }: QuickLinksProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-200">Quick Access</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          title="GitHub"
          description="Repos & activity"
          href="/github"
          icon={<Github size={18} className="text-zinc-300" />}
          status={githubStatus}
        />
        <QuickLink
          title="Vercel"
          description="Projects & deploys"
          href="/vercel"
          icon={<Triangle size={18} className="text-zinc-300" />}
          status={vercelStatus}
        />
        <QuickLink
          title="AI Usage"
          description="Token usage & models"
          href="/ai-usage"
          icon={<Brain size={18} className="text-zinc-300" />}
          status={aiStatus}
        />
      </div>
    </div>
  );
}
