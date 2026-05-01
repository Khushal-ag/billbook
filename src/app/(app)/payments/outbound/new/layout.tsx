import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Record payment",
};

export default function RecordPaymentLayout({ children }: { children: ReactNode }) {
  return children;
}
