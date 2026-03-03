"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import {
  LandingPromoBar,
  LandingHeader,
  LandingHeroSection,
  LandingFeatureTabs,
  LandingValueGrid,
  LandingFaq,
  LandingFooter,
} from "@/components/landing/LandingSections";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams?.get("from") ?? undefined;
  const isLoggingOut = searchParams?.get("loggedOut") === "1";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (isLoggingOut) return;
    router.replace("/dashboard");
  }, [isAuthenticated, isLoading, isLoggingOut, router]);

  return (
    <div className="min-h-screen bg-background">
      <AuthModal redirectTo={redirectTo} />
      <LandingPromoBar />
      <LandingHeader />
      <main>
        <LandingHeroSection />
        <LandingFeatureTabs />
        <LandingValueGrid />
        <LandingFaq />
        <LandingFooter />
      </main>
    </div>
  );
}
