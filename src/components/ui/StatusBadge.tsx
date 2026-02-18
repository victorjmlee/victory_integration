import clsx from "clsx";
import type { ConnectionStatus } from "@/types/common";

interface StatusBadgeProps {
  status: ConnectionStatus;
  label?: string;
}

const statusStyles: Record<ConnectionStatus, { dot: string; text: string; bg: string }> = {
  connected: { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
  disconnected: { dot: "bg-zinc-500", text: "text-zinc-500", bg: "bg-zinc-500/10" },
  error: { dot: "bg-red-400", text: "text-red-400", bg: "bg-red-400/10" },
  loading: { dot: "bg-yellow-400 animate-pulse", text: "text-yellow-400", bg: "bg-yellow-400/10" },
};

const defaultLabels: Record<ConnectionStatus, string> = {
  connected: "Connected",
  disconnected: "Not configured",
  error: "Error",
  loading: "Checking...",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        style.bg,
        style.text
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", style.dot)} />
      {label ?? defaultLabels[status]}
    </span>
  );
}
