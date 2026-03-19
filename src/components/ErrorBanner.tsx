import { AlertCircle } from "lucide-react";
import { ApiClientError } from "@/api/error";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  error: unknown;
  fallbackMessage?: string;
  className?: string;
}

export default function ErrorBanner({
  error,
  fallbackMessage = "Something went wrong",
  className,
}: ErrorBannerProps) {
  if (!error) return null;

  const message = error instanceof Error ? error.message : fallbackMessage;
  const requestId = error instanceof ApiClientError ? error.requestId : undefined;

  return (
    <div
      className={cn(
        "mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 space-y-1">
          <p>{message}</p>
          {requestId ? (
            <p className="text-xs opacity-90">
              Request ID: <code className="rounded bg-destructive/15 px-1 py-0.5">{requestId}</code>{" "}
              — share with support if you report this issue.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
