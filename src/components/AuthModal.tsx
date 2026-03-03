import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import LoginCard from "@/components/auth/LoginCard";
import SignupCard from "@/components/auth/SignupCard";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";

type AuthMode = "login" | "signup" | "forgot";

type AuthModalProps = {
  redirectTo?: string;
};

const AUTH_PARAM = "auth";

export default function AuthModal({ redirectTo }: AuthModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safePathname = pathname ?? "/";

  const mode = useMemo<AuthMode | null>(() => {
    const value = searchParams?.get(AUTH_PARAM);
    if (value === "login" || value === "signup" || value === "forgot") return value;
    return null;
  }, [searchParams]);

  const open = !!mode;

  const setMode = (next: AuthMode | null) => {
    const nextParams = new URLSearchParams(searchParams ?? undefined);
    if (!next) {
      nextParams.delete(AUTH_PARAM);
    } else {
      nextParams.set(AUTH_PARAM, next);
    }
    const qs = nextParams.toString();
    router.replace(qs ? `${safePathname}?${qs}` : safePathname);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setMode(null);
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 sm:rounded-xl">
        <DialogTitle className="sr-only">
          {mode === "signup" ? "Sign up" : mode === "forgot" ? "Reset password" : "Log in"}
        </DialogTitle>
        <div className="p-0">
          {mode === "signup" ? (
            <SignupCard redirectTo={redirectTo} onRequestLogin={() => setMode("login")} />
          ) : mode === "forgot" ? (
            <ForgotPasswordCard onBackToLogin={() => setMode("login")} />
          ) : (
            <LoginCard
              redirectTo={redirectTo}
              onRequestSignup={() => setMode("signup")}
              onRequestForgot={() => setMode("forgot")}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
