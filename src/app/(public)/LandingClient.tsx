"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface LandingClientProps {
  redirectTo?: string;
  isLoggingOut: boolean;
}

export default function LandingClient({ redirectTo, isLoggingOut }: LandingClientProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (isLoggingOut) return;
    router.replace("/dashboard");
  }, [isAuthenticated, isLoading, isLoggingOut, router]);

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <AuthModal redirectTo={redirectTo} />
      </Suspense>
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
