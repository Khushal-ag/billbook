import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import type {
  PasswordResetOtpResponse,
  PasswordResetVerifyResponse,
  PasswordResetResponse,
} from "@/types/auth";

type ForgotPasswordCardProps = {
  onBackToLogin?: () => void;
};

type Stage = "request" | "verify" | "reset" | "done";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  organizationCode: z
    .string()
    .trim()
    .length(6, "Organization code must be 6 characters")
    .transform((v) => v.toUpperCase()),
  otp: z.string().trim().length(6, "OTP must be 6 digits").optional().or(z.literal("")),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

function expiresInToMinutes(expiresIn: number): number {
  // Backend contract: milliseconds (e.g. 600000). Be defensive if seconds are returned.
  const ms = expiresIn >= 10_000 ? expiresIn : expiresIn * 1000;
  return Math.max(1, Math.round(ms / 60_000));
}

export default function ForgotPasswordCard({ onBackToLogin }: ForgotPasswordCardProps) {
  const [stage, setStage] = useState<Stage>("request");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      organizationCode: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const email = watch("email");
  const organizationCode = watch("organizationCode");

  const { ref: otpFormRef, ...otpRegisterRest } = register("otp");
  const { ref: pwdFormRef, ...pwdRegisterRest } = register("newPassword");

  useEffect(() => {
    if (stage === "verify") {
      const id = requestAnimationFrame(() => otpInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    if (stage === "reset") {
      const id = requestAnimationFrame(() => passwordInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [stage]);

  const subtitle = useMemo(() => {
    if (stage === "verify") return "Enter the 6-digit OTP sent to your email";
    if (stage === "reset") return "Set a new password for your account";
    if (stage === "done") return "Your password has been updated";
    return "Enter your email and organization code to receive a reset OTP";
  }, [stage]);

  const requestOtp = async (data: { email: string; organizationCode: string }) => {
    const res = await api.post<PasswordResetOtpResponse>("/auth/password/request-otp", data);
    return res.data;
  };
  const verifyOtp = async (data: { email: string; organizationCode: string; otp: string }) => {
    const res = await api.post<PasswordResetVerifyResponse>("/auth/password/verify-otp", data);
    return res.data;
  };
  const resetPassword = async (data: { resetToken: string; newPassword: string }) => {
    const res = await api.post<PasswordResetResponse>("/auth/password/reset", data);
    return res.data;
  };

  const handleResendOtp = async () => {
    setError(null);
    setInfo(null);
    try {
      const resp = await requestOtp({
        email: email.trim(),
        organizationCode: organizationCode.trim().toUpperCase(),
      });
      setInfo(resp.message || "If the account exists, an OTP has been sent.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    }
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    setInfo(null);

    try {
      if (stage === "request") {
        const resp = await requestOtp({
          email: data.email,
          organizationCode: data.organizationCode,
        });
        setInfo(resp.message || "If the account exists, an OTP has been sent.");
        setStage("verify");
        return;
      }

      if (stage === "verify") {
        const otp = (data.otp ?? "").trim();
        if (!otp) {
          setError("OTP is required");
          return;
        }
        const resp = await verifyOtp({
          email: data.email,
          organizationCode: data.organizationCode,
          otp,
        });
        setResetToken(resp.resetToken);
        setInfo(
          `OTP verified. Reset link expires in ${expiresInToMinutes(resp.expiresIn)} minutes.`,
        );
        setStage("reset");
        return;
      }

      if (stage === "reset") {
        const newPassword = (data.newPassword ?? "").trim();
        const confirm = (data.confirmPassword ?? "").trim();
        if (!resetToken) {
          setError("Reset session expired. Please request a new OTP.");
          setStage("request");
          return;
        }
        if (!newPassword) {
          setError("New password is required");
          return;
        }
        if (newPassword.length < 8) {
          setError("Password must be at least 8 characters");
          return;
        }
        if (confirm !== newPassword) {
          setError("Passwords do not match");
          return;
        }
        const resp = await resetPassword({ resetToken, newPassword });
        if (resp.success) {
          setInfo("Password updated successfully. Please sign in again.");
        } else {
          setInfo("Password update completed.");
        }
        setResetToken(null);
        setStage("done");
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Card className="border-border/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          name="forgot-password"
          method="post"
          autoComplete="on"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {error && (
            <div className="whitespace-pre-line rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {info && (
            <div className="whitespace-pre-line rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {info}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@company.com"
              disabled={stage !== "request"}
              aria-invalid={!!errors.email}
              {...register("email")}
              autoComplete="email"
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationCode" required>
              Organization code
            </Label>
            <Input
              id="organizationCode"
              placeholder="ABC123"
              disabled={stage !== "request"}
              maxLength={6}
              className="uppercase"
              aria-invalid={!!errors.organizationCode}
              autoCapitalize="characters"
              autoCorrect="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              {...register("organizationCode")}
              autoComplete="off"
            />
            {errors.organizationCode && <FieldError>{errors.organizationCode.message}</FieldError>}
          </div>

          {stage === "verify" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp" required>
                  OTP
                </Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="123456"
                  maxLength={6}
                  aria-invalid={!!errors.otp}
                  ref={(el) => {
                    otpFormRef(el);
                    otpInputRef.current = el;
                  }}
                  {...otpRegisterRest}
                  autoComplete="one-time-code"
                />
                {errors.otp && <FieldError>{errors.otp.message}</FieldError>}
              </div>
              <p className="text-xs text-muted-foreground">OTP expires in 10 minutes.</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <button
                  type="button"
                  className="transition-colors hover:text-foreground"
                  disabled={isSubmitting}
                  onClick={() => {
                    setStage("request");
                    setValue("otp", "");
                    setInfo(null);
                    setError(null);
                  }}
                >
                  Use different email
                </button>
                <button
                  type="button"
                  className="transition-colors hover:text-foreground"
                  disabled={isSubmitting || !email || !organizationCode}
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {stage === "reset" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword" required>
                  New password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  aria-invalid={!!errors.newPassword}
                  ref={(el) => {
                    pwdFormRef(el);
                    passwordInputRef.current = el;
                  }}
                  {...pwdRegisterRest}
                  autoComplete="new-password"
                />
                {errors.newPassword && <FieldError>{errors.newPassword.message}</FieldError>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" required>
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <FieldError>{errors.confirmPassword.message}</FieldError>
                )}
              </div>
            </>
          )}

          {stage === "done" ? (
            <Button type="button" className="w-full" onClick={onBackToLogin}>
              Back to sign in
            </Button>
          ) : (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {stage === "request"
                ? "Send OTP"
                : stage === "verify"
                  ? "Verify OTP"
                  : "Update password"}
            </Button>
          )}

          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={onBackToLogin}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
