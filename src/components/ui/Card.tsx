import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-zinc-800 bg-zinc-900/50 p-5",
        hover && "transition-colors hover:border-zinc-700 hover:bg-zinc-900",
        className
      )}
    >
      {children}
    </div>
  );
}
