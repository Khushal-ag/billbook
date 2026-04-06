"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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

const SECTION_HASH_IDS = new Set(["features", "faq"]);

export default function LandingClient({ redirectTo, isLoggingOut }: LandingClientProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Next.js client navigation to `/#features` or `/#faq` does not always scroll; align with the hash.
  useEffect(() => {
    if (pathname !== "/") return;

    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!SECTION_HASH_IDS.has(id)) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const run = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToHash);
      });
    };

    run();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [pathname]);

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
