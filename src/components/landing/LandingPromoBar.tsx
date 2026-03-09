import { Zap } from "lucide-react";

export function LandingPromoBar() {
  return (
    <div className="via-accent/8 border-b bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2.5 lg:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <Zap className="h-3 w-3" />
          New
        </span>
        <span className="text-sm font-medium text-foreground">
          GST-ready billing, compliance exports &amp; audit trails — all in one platform.
        </span>
      </div>
    </div>
  );
}
