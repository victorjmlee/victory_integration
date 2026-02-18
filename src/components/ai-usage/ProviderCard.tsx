import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/utils";
import type { ConnectionStatus } from "@/types/common";

interface ProviderCardProps {
  name: string;
  icon: React.ReactNode;
  status: ConnectionStatus;
  totalTokens?: number;
  error?: string;
  children?: React.ReactNode;
}

export function ProviderCard({
  name,
  icon,
  status,
  totalTokens,
  error,
  children,
}: ProviderCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-zinc-800 p-2">{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{name}</h3>
            {totalTokens !== undefined && totalTokens > 0 && (
              <p className="text-xs text-zinc-400">
                {formatNumber(totalTokens)} total tokens (30d)
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      {error && (
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-400 mb-4">
          {error}
        </div>
      )}
      {children}
    </Card>
  );
}
