import { formatDistanceToNow, format } from "date-fns";

export function formatRelativeTime(date: string | number): string {
  const d = typeof date === "number" ? new Date(date) : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: string | number): string {
  const d = typeof date === "number" ? new Date(date) : new Date(date);
  return format(d, "MMM d, yyyy");
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function getLanguageColor(language: string | null): string {
  const colors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Ruby: "#701516",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
  };
  return colors[language ?? ""] ?? "#8b8b8b";
}

export function getDeploymentStatusColor(state: string): string {
  switch (state) {
    case "READY":
      return "text-emerald-400";
    case "BUILDING":
    case "INITIALIZING":
    case "QUEUED":
      return "text-yellow-400";
    case "ERROR":
      return "text-red-400";
    case "CANCELED":
      return "text-zinc-500";
    default:
      return "text-zinc-400";
  }
}

export function getEventDescription(event: { type: string; payload: { action?: string; ref?: string; ref_type?: string; commits?: Array<{ message: string }>; pull_request?: { title: string; number: number } } }): string {
  switch (event.type) {
    case "PushEvent": {
      const count = event.payload.commits?.length ?? 0;
      return `Pushed ${count} commit${count !== 1 ? "s" : ""}`;
    }
    case "CreateEvent":
      return `Created ${event.payload.ref_type ?? "repository"}${event.payload.ref ? ` "${event.payload.ref}"` : ""}`;
    case "DeleteEvent":
      return `Deleted ${event.payload.ref_type ?? "branch"}${event.payload.ref ? ` "${event.payload.ref}"` : ""}`;
    case "PullRequestEvent":
      return `${event.payload.action ?? "opened"} PR #${event.payload.pull_request?.number}: ${event.payload.pull_request?.title}`;
    case "IssuesEvent":
      return `${event.payload.action ?? "opened"} an issue`;
    case "WatchEvent":
      return "Starred a repository";
    case "ForkEvent":
      return "Forked a repository";
    case "ReleaseEvent":
      return `${event.payload.action ?? "published"} a release`;
    default:
      return event.type.replace("Event", "");
  }
}
