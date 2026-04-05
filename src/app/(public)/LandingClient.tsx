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
  LandingCtaBanner,
  LandingFooter,
} from "@/components/landing/LandingSections";
import { useAuth } from "@/contexts/AuthContext";

interface LandingClientProps {
  redirectTo?: string;
  isLoggingOut: boolean;
}

export default function LandingClient({ redirectTo, isLoggingOut }: LandingClientProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Send business users to the app; platform admins can stay on the marketing home (`/`).
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (isLoggingOut) return;
    if (user?.role === "ADMIN") return;
    router.replace("/dashboard");
  }, [isAuthenticated, isLoading, isLoggingOut, user?.role, router]);

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
        <LandingCtaBanner />
        <LandingFooter />
      </main>
    </div>
  );
}
