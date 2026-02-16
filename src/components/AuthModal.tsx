import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginCard from "@/components/auth/LoginCard";
import SignupCard from "@/components/auth/SignupCard";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";

type AuthMode = "login" | "signup" | "forgot";

type AuthModalProps = {
  redirectTo?: string;
};

const AUTH_PARAM = "auth";

export default function AuthModal({ redirectTo }: AuthModalProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const mode = useMemo<AuthMode | null>(() => {
    const value = searchParams.get(AUTH_PARAM);
    if (value === "login" || value === "signup" || value === "forgot") return value;
    return null;
  }, [searchParams]);

  const open = !!mode;

  const setMode = (next: AuthMode | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!next) {
      nextParams.delete(AUTH_PARAM);
    } else {
      nextParams.set(AUTH_PARAM, next);
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setMode(null);
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 sm:rounded-xl">
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
