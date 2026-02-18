import { Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const state = location.state as { from?: string; loggedOut?: boolean } | null;
  const redirectTo = state?.from;
  const isLoggingOut = Boolean(state?.loggedOut);

  if (!isLoading && isAuthenticated && !isLoggingOut) {
    return <Navigate to="/dashboard" replace />;
  }

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
