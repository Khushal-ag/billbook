import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  organizationCode: z.string().trim().min(1, "Organization code is required").max(64),
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
  const { requestLoginOtp, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [otpRequested, setOtpRequested] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      if (!otpRequested) {
        await requestLoginOtp({
          email: data.email,
          organizationCode: data.organizationCode,
        });
        setOtpRequested(true);
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
      navigate(redirectTo || "/dashboard", { replace: true });
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

  return (
    <Card className="border-border/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          {otpRequested
            ? "Enter the 6-digit OTP sent to your email"
            : "Enter your email and organization code to receive OTP"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              disabled={otpRequested}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationCode">Organization code</Label>
            <Input
              id="organizationCode"
              placeholder="ABC123"
              disabled={otpRequested}
              {...register("organizationCode")}
            />
            {errors.organizationCode && (
              <p className="text-xs text-destructive">{errors.organizationCode.message}</p>
            )}
          </div>

          {otpRequested && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input id="otp" placeholder="123456" maxLength={6} {...register("otp")} />
                {errors.otp && <p className="text-xs text-destructive">{errors.otp.message}</p>}
              </div>

              <p className="text-xs text-muted-foreground">OTP expires in 10 minutes.</p>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setOtpRequested(false);
                    setValue("otp", "");
                  }}
                  className="transition-colors hover:text-foreground"
                >
                  Use different email or organization code
                </button>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {otpRequested ? "Verify OTP & Sign in" : "Send OTP"}
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
              <Link to="/?auth=forgot" className="transition-colors hover:text-foreground">
                Forgot password?
              </Link>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            {onRequestSignup ? (
              <button
                type="button"
                onClick={onRequestSignup}
                className="font-medium text-accent hover:underline"
              >
                Sign up
              </button>
            ) : (
              <Link to="/?auth=signup" className="font-medium text-accent hover:underline">
                Sign up
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
