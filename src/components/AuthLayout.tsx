import type { ReactNode } from "react";
import Logo from "@/components/Logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex items-center justify-center">
          <Logo
            className="h-10 w-10"
            showText={true}
            textClassName="text-xl font-bold text-foreground"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
