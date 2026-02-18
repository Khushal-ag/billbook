import { Sparkles } from "lucide-react";

export function LandingPromoBar() {
  return (
    <div className="border-b bg-gradient-to-r from-muted/50 via-muted/30 to-background">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-2 text-xs text-muted-foreground lg:px-8">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Streamline billing, tax, and reporting for your business.
        </span>
      </div>
    </div>
  );
}
