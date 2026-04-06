import type { ReactNode } from "react";
import { LandingPromoBar } from "@/components/landing/LandingPromoBar";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

interface PublicMarketingShellProps {
  children: ReactNode;
}

/**
 * Shared chrome for marketing subpages (legal, contact, help) — matches the
 * landing look without duplicating the home hero.
 */
export function PublicMarketingShell({ children }: PublicMarketingShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <LandingPromoBar />
      <LandingHeader />
      <main className="relative">{children}</main>
      <LandingFooter />
    </div>
  );
}
