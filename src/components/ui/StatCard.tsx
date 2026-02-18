import Link from "next/link";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
}

export function StatCard({ title, value, icon, href }: StatCardProps) {
  const content = (
    <Card hover={!!href}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
        </div>
        <div className="rounded-lg bg-zinc-800 p-2.5 text-zinc-400">
          {icon}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
