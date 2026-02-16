import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  useBusinessProfile,
  useUpdateBusinessProfile,
  useBusinessUsers,
} from "@/hooks/use-business";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(15).optional().or(z.literal("")),
  gstin: z.string().trim().length(15, "GSTIN must be 15 characters").optional().or(z.literal("")),
  pan: z.string().trim().length(10, "PAN must be 10 characters").optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().max(10).optional().or(z.literal("")),
  taxType: z.enum(["GST", "NON_GST"]).default("GST"),
  financialYearStart: z.coerce.number().min(1).max(12).default(4),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Settings() {
  const { data: business, isPending } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: business
      ? {
          name: business.name || "",
          email: business.email || "",
          phone: business.phone || "",
          gstin: business.gstin || "",
          pan: business.pan || "",
          address: business.address || "",
          city: business.city || "",
          state: business.state || "",
          postalCode: business.postalCode || "",
          taxType: business.taxType || "GST",
          financialYearStart: business.financialYearStart || 4,
        }
      : undefined,
  });

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync({ ...data, name: data.name });
      showSuccessToast("Business profile updated");
    } catch (err) {
      showErrorToast(err, "Failed to update");
    }
  };

  if (isPending) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Business Settings"
        description="Manage your business profile and preferences"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-xs text-destructive" role="alert">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="business@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-xs text-destructive" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
                  <p className="text-xs text-muted-foreground">Optional contact number</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    placeholder="22AAAAA0000A1Z5"
                    {...register("gstin")}
                    maxLength={15}
                    aria-invalid={!!errors.gstin}
                    aria-describedby={errors.gstin ? "gstin-error" : "gstin-hint"}
                  />
                  {errors.gstin ? (
                    <p id="gstin-error" className="text-xs text-destructive" role="alert">
                      {errors.gstin.message}
                    </p>
                  ) : (
                    <p id="gstin-hint" className="text-xs text-muted-foreground">
                      15-character GST identification number
                    </p>
                  )}
                </div>
              </div>

              {/* Tax Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    placeholder="AAAAA0000A"
                    {...register("pan")}
                    maxLength={10}
                    aria-invalid={!!errors.pan}
                    aria-describedby={errors.pan ? "pan-error" : "pan-hint"}
                  />
                  {errors.pan ? (
                    <p id="pan-error" className="text-xs text-destructive" role="alert">
                      {errors.pan.message}
                    </p>
                  ) : (
                    <p id="pan-hint" className="text-xs text-muted-foreground">
                      10-character permanent account number
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="400001"
                    {...register("postalCode")}
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} placeholder="Mumbai" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...register("state")} placeholder="Maharashtra" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Business address"
                  {...register("address")}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">Complete business address</p>
              </div>

              {/* Tax and Financial Settings */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxType">Tax Type</Label>
                  <Controller
                    name="taxType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="taxType" aria-label="Select tax type">
                          <SelectValue placeholder="Select tax type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GST">GST</SelectItem>
                          <SelectItem value="NON_GST">Non-GST</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">Select your business tax type</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="financialYearStart">Financial Year Start Month</Label>
                  <Controller
                    name="financialYearStart"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger
                          id="financialYearStart"
                          aria-label="Select financial year start month"
                        >
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December",
                          ].map((month, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">When your financial year begins</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || updateProfile.isPending}
                  aria-label="Save business profile changes"
                >
                  {(isSubmitting || updateProfile.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
                {isDirty && (
                  <span className="text-xs text-muted-foreground">You have unsaved changes</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Team Members */}
        <BusinessUsersCard />
      </div>
    </div>
  );
}

function BusinessUsersCard() {
  const { data: users, isPending } = useBusinessUsers();

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" aria-label="Loading team members">
            <Skeleton className="h-16 rounded-md" />
            <Skeleton className="h-16 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No team members found. Add users to collaborate on your business.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" role="list" aria-label="Team members list">
          {users.map((u) => (
            <div
              key={u.id}
              role="listitem"
              className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {u.firstName || u.lastName
                    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                    : u.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span
                className="ml-3 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize"
                aria-label={`Role: ${u.role.toLowerCase()}`}
              >
                {u.role.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
