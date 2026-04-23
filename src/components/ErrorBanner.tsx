import { AlertCircle } from "lucide-react";
import { ApiClientError } from "@/api/error";
import { cn } from "@/lib/core/utils";

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

  const message =
    error instanceof ApiClientError && error.status === 401
      ? "Your session expired. Please sign in again."
      : error instanceof Error
        ? error.message
        : fallbackMessage;
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
            <div className="space-y-1 border-t border-destructive/20 pt-2 text-xs text-destructive/90">
              <p className="font-medium">Support reference</p>
              <code className="block break-all rounded bg-destructive/15 px-1.5 py-0.5 font-mono text-[11px]">
                {requestId}
              </code>
              <p className="text-[11px] leading-snug opacity-90">
                Share this code if you contact support about this error.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
