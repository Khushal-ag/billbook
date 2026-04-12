import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { strongPasswordSchema } from "@/lib/validation-schemas";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: strongPasswordSchema,
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  otp: z.string().trim().length(6, "OTP must be 6 digits").optional().or(z.literal("")),
});

type SignupForm = z.infer<typeof signupSchema>;

type SignupCardProps = {
  /** Where to navigate after successful signup */
  redirectTo?: string;
  /** Called when user clicks the Sign in link in-modal */
  onRequestLogin?: () => void;
};

export default function SignupCard({ redirectTo, onRequestLogin }: SignupCardProps) {
  const { requestSignupOtp, verifySignupOtp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (otpRequested) {
      const id = requestAnimationFrame(() => otpInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [otpRequested]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const email = watch("email");
  const password = watch("password");
  const businessName = watch("businessName");

  const { ref: otpFormRef, ...otpRegisterRest } = register("otp");

  const handleResendOtp = async () => {
    setError(null);
    setInfo(null);
    setIsResendingOtp(true);
    try {
      const resp = await requestSignupOtp({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        businessName: businessName.trim(),
      });
      setInfo(resp.message || "OTP resent. Please check your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const onSubmit = async (data: SignupForm) => {
    setError(null);
    setInfo(null);
    try {
      if (!otpRequested) {
        const resp = await requestSignupOtp({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          businessName: data.businessName,
        });
        setInfo(resp.message || "OTP sent. Please check your email.");
        setOtpRequested(true);
        return;
      }

      if (!data.otp) {
        setError("OTP is required");
        return;
      }

      await verifySignupOtp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        otp: data.otp,
      });
      router.replace(redirectTo || "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-lg">Create your account</CardTitle>
        <CardDescription>
          {otpRequested
            ? "Enter the 6-digit OTP sent to your email"
            : "Create account and receive OTP for verification"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {info}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" required>
                First name
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                disabled={otpRequested}
                aria-invalid={!!errors.firstName}
                {...register("firstName")}
              />
              {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" required>
                Last name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                disabled={otpRequested}
                aria-invalid={!!errors.lastName}
                {...register("lastName")}
              />
              {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              disabled={otpRequested}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" required>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, A-Z, a-z, 0-9"
                disabled={otpRequested}
                className="pr-10"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={otpRequested}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName" required>
              Business name
            </Label>
            <Input
              id="businessName"
              placeholder="Acme Enterprises"
              disabled={otpRequested}
              aria-invalid={!!errors.businessName}
              {...register("businessName")}
            />
            {errors.businessName && <FieldError>{errors.businessName.message}</FieldError>}
          </div>

          {otpRequested && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp" required>
                  OTP
                </Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  aria-invalid={!!errors.otp}
                  ref={(el) => {
                    otpFormRef(el);
                    otpInputRef.current = el;
                  }}
                  {...otpRegisterRest}
                />
                {errors.otp && <FieldError>{errors.otp.message}</FieldError>}
              </div>

              <p className="text-xs text-muted-foreground">OTP expires in 10 minutes.</p>

              <div className="text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequested(false);
                      setValue("otp", "");
                      setInfo(null);
                    }}
                    className="transition-colors hover:text-foreground"
                  >
                    Edit signup details
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={
                      isSubmitting ||
                      isResendingOtp ||
                      !firstName ||
                      !lastName ||
                      !email ||
                      !password ||
                      !businessName
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
            {otpRequested ? "Verify OTP & Create account" : "Send OTP"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            {onRequestLogin ? (
              <button
                type="button"
                onClick={onRequestLogin}
                className="font-medium text-accent hover:underline"
              >
                Sign in
              </button>
            ) : (
              <Link href="/?auth=login" className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
