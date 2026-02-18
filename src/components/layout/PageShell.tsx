interface PageShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="min-h-screen lg:pl-64">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 pt-12 lg:pt-0">
          <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
