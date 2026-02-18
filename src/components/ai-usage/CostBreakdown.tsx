"use client";

const MODEL_COLORS: Record<string, string> = {
  "Claude Opus 4.6": "#e07a5f",
  "Claude Opus 4": "#e07a5f",
  "Claude Sonnet 4.6": "#f2b880",
  "Claude Sonnet 4.5": "#f2b880",
  "Claude Sonnet 4": "#e8a87c",
  "Claude Haiku 4.5": "#81b29a",
  "Claude Haiku 3": "#b8c99d",
};

const WORKSPACE_COLORS = ["#7facd6", "#f2b880", "#81b29a", "#c9a8e8", "#e07a5f", "#b8c99d"];

interface CostBreakdownProps {
  costByModel?: { model: string; cost: number }[];
  costByWorkspace?: { workspace: string; cost: number }[];
}

function BreakdownSection({
  title,
  items,
  colorMap,
}: {
  title: string;
  items: { label: string; cost: number }[];
  colorMap: (label: string, i: number) => string;
}) {
  const total = items.reduce((s, i) => s + i.cost, 0);
  if (total === 0) return null;

  return (
    <div className="min-w-0 flex-1">
      <h4 className="mb-2 text-xs font-medium text-zinc-400">{title}</h4>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const pct = total > 0 ? (item.cost / total) * 100 : 0;
          const color = colorMap(item.label, i);
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-28 shrink-0 truncate text-xs text-zinc-300" title={item.label}>
                {item.label}
              </span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-zinc-800">
                <div
                  className="absolute inset-y-0 left-0 rounded"
                  style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color, opacity: 0.7 }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs font-medium text-zinc-200">
                ${item.cost.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CostBreakdown({ costByModel, costByWorkspace }: CostBreakdownProps) {
  const hasModel = costByModel && costByModel.length > 0;
  const hasWorkspace = costByWorkspace && costByWorkspace.length > 0;
  if (!hasModel && !hasWorkspace) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      {hasModel && (
        <BreakdownSection
          title="Cost by Model"
          items={costByModel.map((m) => ({ label: m.model, cost: m.cost }))}
          colorMap={(label) => MODEL_COLORS[label] ?? "#a1a1aa"}
        />
      )}
      {hasWorkspace && (
        <BreakdownSection
          title="Cost by Workspace"
          items={costByWorkspace.map((w) => ({ label: w.workspace, cost: w.cost }))}
          colorMap={(_, i) => WORKSPACE_COLORS[i % WORKSPACE_COLORS.length]}
        />
      )}
    </div>
  );
}
