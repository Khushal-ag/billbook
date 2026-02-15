import { AlertCircle } from "lucide-react";
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

  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
