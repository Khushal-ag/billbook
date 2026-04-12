"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { siteConfig } from "@/lib/site-config";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required"),
  organizationCode: z
    .string()
    .trim()
    .min(1, "Organization code is required")
    .transform((v) => v.toUpperCase()),
});

type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { adminLogin, user, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      organizationCode: "ADMIN0",
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "ADMIN") {
      router.replace("/admin/businesses");
    }
  }, [user, isLoading, router]);

  const onSubmit = async (data: Form) => {
    setError(null);
    try {
      await adminLogin({
        email: data.email,
        password: data.password,
        organizationCode: data.organizationCode,
      });
      router.replace("/admin/businesses");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role === "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-muted/40 via-background to-muted/30 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.08] via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-5 transition-opacity hover:opacity-90"
            aria-label="BillBook home"
          >
            <Logo className="h-12 w-12" textClassName="text-2xl font-bold tracking-tight" />
          </Link>
          <p className="text-sm text-muted-foreground">Administrator sign-in</p>
        </div>

        <Card className="border-border/80 shadow-xl">
          <CardHeader className="space-y-1 pb-4 text-center sm:text-left">
            <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
            <CardDescription>
              Use your admin email, password, and organization code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-email" required>
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  className="h-10"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" required>
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  className="h-10"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-org" required>
                  Organization code
                </Label>
                <Input
                  id="admin-org"
                  className="h-10 font-mono uppercase tracking-wide"
                  aria-invalid={!!errors.organizationCode}
                  {...register("organizationCode")}
                />
                {errors.organizationCode && (
                  <FieldError>{errors.organizationCode.message}</FieldError>
                )}
              </div>
              <Button
                type="submit"
                className="h-10 w-full shadow-sm"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/"
                  className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline"
                >
                  ← Back to {siteConfig.name}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
