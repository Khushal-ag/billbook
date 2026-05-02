import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Payments",
};

export default function PaymentsOutboundLayout({ children }: { children: ReactNode }) {
  return children;
}
