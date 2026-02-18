import { AlertCircle, KeyRound } from "lucide-react";
import { Card } from "./Card";

interface ErrorStateProps {
  title?: string;
  message: string;
  isTokenError?: boolean;
}

export function ErrorState({ title, message, isTokenError = false }: ErrorStateProps) {
  return (
    <Card className="border-zinc-700">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-zinc-800 p-3 mb-4">
          {isTokenError ? (
            <KeyRound size={24} className="text-yellow-400" />
          ) : (
            <AlertCircle size={24} className="text-red-400" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">
          {title ?? (isTokenError ? "API Token Not Configured" : "Error Loading Data")}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-400">{message}</p>
        {isTokenError && (
          <div className="mt-4 rounded-lg bg-zinc-800/50 px-4 py-3 text-left text-xs text-zinc-400">
            <p className="font-medium text-zinc-300 mb-1">Setup Guide:</p>
            <p>1. Create a <code className="text-violet-400">.env.local</code> file in the project root</p>
            <p>2. Add the required API token</p>
            <p>3. Restart the dev server</p>
          </div>
        )}
      </div>
    </Card>
  );
}
