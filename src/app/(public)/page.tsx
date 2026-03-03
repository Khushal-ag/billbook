import type { Metadata } from "next";
import LandingClient from "./LandingClient";

interface LandingPageProps {
  searchParams?: Promise<{
    from?: string | string[];
    loggedOut?: string | string[];
  }>;
}

export const metadata: Metadata = {
  title: "BillBook – Invoicing & Billing Management",
  description:
    "Create GST invoices, manage parties, track payments, and run your small business effortlessly with BillBook.",
  alternates: {
    canonical: "/",
  },
};

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectToValue = resolvedSearchParams?.from;
  const loggedOutValue = resolvedSearchParams?.loggedOut;

  const redirectTo = Array.isArray(redirectToValue) ? redirectToValue[0] : redirectToValue;
  const isLoggingOut = (Array.isArray(loggedOutValue) ? loggedOutValue[0] : loggedOutValue) === "1";

  return <LandingClient redirectTo={redirectTo} isLoggingOut={isLoggingOut} />;
}
