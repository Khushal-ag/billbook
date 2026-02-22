import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit"),
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
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError(null);
    try {
      if (!otpRequested) {
        await requestSignupOtp({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          businessName: data.businessName,
        });
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
      navigate(redirectTo || "/dashboard", { replace: true });
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="John"
                disabled={otpRequested}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                disabled={otpRequested}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, A-Z, a-z, 0-9"
                disabled={otpRequested}
                className="pr-10"
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
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              placeholder="Acme Enterprises"
              disabled={otpRequested}
              {...register("businessName")}
            />
            {errors.businessName && (
              <p className="text-xs text-destructive">{errors.businessName.message}</p>
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
                  Edit signup details
                </button>
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
              <Link to="/?auth=login" className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
