import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const { data: business, isLoading } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync({ ...data, name: data.name });
      showSuccessToast("Business profile updated");
    } catch (err) {
      showErrorToast(err, "Failed to update");
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Business Settings"
        description="Manage your business profile and preferences"
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="+91 98765 43210" {...register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input placeholder="22AAAAA0000A1Z5" {...register("gstin")} />
                  {errors.gstin && (
                    <p className="text-xs text-destructive">{errors.gstin.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input placeholder="AAAAA0000A" {...register("pan")} />
                  {errors.pan && <p className="text-xs text-destructive">{errors.pan.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input placeholder="400001" {...register("postalCode")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input {...register("state")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="Business address" {...register("address")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Type</Label>
                  <Select
                    defaultValue={business?.taxType || "GST"}
                    onValueChange={(v) => {
                      const event = { target: { name: "taxType", value: v } };
                      register("taxType").onChange(event as never);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST</SelectItem>
                      <SelectItem value="NON_GST">Non-GST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Financial Year Start Month</Label>
                  <Select
                    defaultValue={String(business?.financialYearStart || 4)}
                    onValueChange={(v) => {
                      const event = { target: { name: "financialYearStart", value: v } };
                      register("financialYearStart").onChange(event as never);
                    }}
                  >
                    <SelectTrigger>
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
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting || updateProfile.isPending}>
                {(isSubmitting || updateProfile.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
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
  const { data: users, isLoading } = useBusinessUsers();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No team members found.</p>
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
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {u.firstName || u.lastName
                    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                    : u.email}
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
