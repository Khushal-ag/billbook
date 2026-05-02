"use client";

import DashboardPageClient from "@/components/dashboard/DashboardPageClient";
import StaffWelcomeDashboard from "@/components/dashboard/StaffWelcomeDashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "STAFF") {
    return (
      <div className="page-container animate-fade-in">
        <StaffWelcomeDashboard />
      </div>
    );
  }
  return <DashboardPageClient />;
}
