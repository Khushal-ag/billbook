import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { LAST_ORGANIZATION_CODE_KEY } from "@/constants/auth-storage";
import { isReservedAdminOrganizationCode } from "@/lib/org/organization-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  organizationCode: z
    .string()
    .trim()
    .length(6, "Organization code must be 6 characters")
    .transform((v) => v.toUpperCase()),
  password: z.string().optional().or(z.literal("")),
  otp: z.string().trim().length(6, "OTP must be 6 digits").optional().or(z.literal("")),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginCardProps = {
  /** Where to navigate after successful login */
  redirectTo?: string;
  /** Called when user clicks the Sign up link in-modal */
  onRequestSignup?: () => void;
  /** Called when user clicks Forgot password in-modal */
  onRequestForgot?: () => void;
};

export default function LoginCard({
  redirectTo,
  onRequestSignup,
  onRequestForgot,
}: LoginCardProps) {
  const { requestLoginOtp, verifyLoginOtp, adminLogin } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  /** After first step: whether to show the email OTP field (false for reserved admin org codes or API). */
  const [showOtpField, setShowOtpField] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const prefilledOrg = useRef(false);

  useEffect(() => {
    if (showOtpField) {
      const id = requestAnimationFrame(() => otpInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [showOtpField]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch("email");
  const organizationCode = watch("organizationCode");
  const password = watch("password");

  const { ref: otpFormRef, ...otpRegisterRest } = register("otp");

  useEffect(() => {
    if (prefilledOrg.current) return;
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LAST_ORGANIZATION_CODE_KEY);
    if (saved?.trim()) {
      setValue("organizationCode", saved.trim().toUpperCase());
      prefilledOrg.current = true;
    }
  }, [setValue]);

  const handleResendOtp = async () => {
    setError(null);
    setInfo(null);
    const pwd = password?.trim();
    if (!pwd) {
      setError("Password is required to resend OTP.");
      return;
    }
    setIsResendingOtp(true);
    try {
      const resp = await requestLoginOtp({
        email: email.trim(),
        organizationCode: organizationCode.trim().toUpperCase(),
        password: pwd,
      });
      if (resp.requiresOtp === false) {
        setShowOtpField(false);
        setError(
          "Email OTP is not enabled for this organization. Confirm your organization code or contact support.",
        );
        return;
      }
      setInfo(resp.message || "OTP resent. Please check your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setInfo(null);
    try {
      if (!showOtpField) {
        const pwd = data.password?.trim();
        if (!pwd) {
          setError("Password is required.");
          return;
        }

        const org = data.organizationCode.trim().toUpperCase();

        if (isReservedAdminOrganizationCode(org)) {
          await adminLogin({
            email: data.email,
            password: pwd,
            organizationCode: org,
          });
          router.replace(redirectTo || "/dashboard");
          return;
        }

        const resp = await requestLoginOtp({
          email: data.email,
          organizationCode: org,
          password: pwd,
        });

        if (resp.requiresOtp === false) {
          setError(
            "Email OTP is not enabled for this organization. Confirm your organization code or contact support.",
          );
          return;
        }

        setInfo(resp.message || "OTP sent. Please check your email.");
        setShowOtpField(true);
        return;
      }

      if (!data.otp) {
        setError("OTP is required");
        return;
      }

      await verifyLoginOtp({
        email: data.email,
        organizationCode: data.organizationCode,
        otp: data.otp,
      });
      router.replace(redirectTo || "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const adminOrgHint = isReservedAdminOrganizationCode(organizationCode?.trim() ?? "");

  return (
    <Card className="border-border/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          {showOtpField
            ? "Enter the 6-digit OTP sent to your email"
            : "Enter your email and password, then your 6-character organization code"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          name="login"
          method="post"
          autoComplete="on"
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={handleKeyDown}
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
              disabled={showOtpField}
              aria-invalid={!!errors.email}
              {...register("email")}
              autoComplete="email"
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </div>

          {!showOtpField && (
            <div className="space-y-2">
              <Label htmlFor="password" required>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Required to continue"
                  className="pr-9"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </div>
          )}

          {!showOtpField && (
            <div className="space-y-2">
              <Label htmlFor="organizationCode" required>
                Organization code
              </Label>
              <Input
                id="organizationCode"
                placeholder="ABC123"
                disabled={showOtpField}
                maxLength={6}
                className="uppercase"
                aria-invalid={!!errors.organizationCode}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                {...register("organizationCode")}
                autoComplete="off"
              />
              {errors.organizationCode && (
                <FieldError>{errors.organizationCode.message}</FieldError>
              )}
            </div>
          )}

          {showOtpField && (
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

              <div className="text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpField(false);
                      setValue("otp", "");
                      setInfo(null);
                    }}
                    className="transition-colors hover:text-foreground"
                  >
                    Use different email or organization code
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={
                      isSubmitting || isResendingOtp || !email || !organizationCode || !password
                    }
                    className="transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResendingOtp ? "Resending..." : "Resend OTP"}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {showOtpField ? "Verify OTP & Sign in" : adminOrgHint ? "Sign in" : "Send OTP"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {onRequestForgot ? (
              <button
                type="button"
                onClick={onRequestForgot}
                className="transition-colors hover:text-foreground"
              >
                Forgot password?
              </button>
            ) : (
              <Link href="/?auth=forgot" className="transition-colors hover:text-foreground">
                Forgot password?
              </Link>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            {onRequestSignup ? (
              <button
                type="button"
                onClick={onRequestSignup}
                className="font-medium text-accent hover:underline"
              >
                Sign up
              </button>
            ) : (
              <Link href="/?auth=signup" className="font-medium text-accent hover:underline">
                Sign up
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
