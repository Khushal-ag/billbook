import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  useBusinessProfile,
  useUpdateBusinessProfile,
} from "@/hooks/use-business";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(15).optional().or(z.literal("")),
  gstin: z
    .string()
    .trim()
    .length(15, "GSTIN must be 15 characters")
    .optional()
    .or(z.literal("")),
  pan: z
    .string()
    .trim()
    .length(10, "PAN must be 10 characters")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  pincode: z.string().trim().max(10).optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Settings() {
  const { toast } = useToast();
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
          pincode: business.pincode || "",
        }
      : undefined,
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync(data);
      toast({ title: "Business profile updated" });
    } catch (err) {
      toast({
        title: "Failed to update",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-96 max-w-2xl rounded-xl" />
      </div>
    );
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
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
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
                    <p className="text-xs text-destructive">
                      {errors.gstin.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input placeholder="AAAAA0000A" {...register("pan")} />
                  {errors.pan && (
                    <p className="text-xs text-destructive">
                      {errors.pan.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input placeholder="400001" {...register("pincode")} />
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
                <Input
                  placeholder="Business address"
                  {...register("address")}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || updateProfile.isPending}
              >
                {(isSubmitting || updateProfile.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
