import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type {
  BusinessProfile,
  UpdateBusinessProfile,
  BusinessUser,
  BusinessProfileUploadResponse,
} from "@/types/auth";
import type { DashboardData } from "@/types/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<DashboardData>("/business/dashboard");
      return res.data;
    },
  });
}

/** Normalize GET /business/profile response (legacy address/postalCode → street/pincode). */
function normalizeBusinessProfile(raw: Record<string, unknown>): BusinessProfile {
  const r = raw as unknown as BusinessProfile & { address?: string; postalCode?: string };
  return {
    ...r,
    country: r.country ?? "India",
    street: r.street ?? r.address ?? null,
    area: r.area ?? null,
    pincode: r.pincode ?? r.postalCode ?? null,
    businessType: r.businessType ?? null,
    industryType: r.industryType ?? null,
    registrationType: r.registrationType ?? null,
    extraDetails: Array.isArray(r.extraDetails) ? r.extraDetails : null,
    financialYearStart: typeof r.financialYearStart === "number" ? r.financialYearStart : 4,
  } as BusinessProfile;
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: ["business-profile"],
    queryFn: async () => {
      const res = await api.get<BusinessProfile>("/business/profile");
      return normalizeBusinessProfile(res.data as unknown as Record<string, unknown>);
    },
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBusinessProfile) => {
      const res = await api.put<BusinessProfile>("/business/profile", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-profile"] }),
  });
}

/** Upload logo and/or signature; returns URLs to use in profile update. */
export async function uploadBusinessProfileAssets(files: {
  logo?: File | null;
  signature?: File | null;
}): Promise<BusinessProfileUploadResponse> {
  const { logo, signature } = files;
  if (!logo && !signature) return {};
  const formData = new FormData();
  if (logo) formData.append("logo", logo);
  if (signature) formData.append("signature", signature);
  const res = await api.postForm<BusinessProfileUploadResponse>(
    "/business/profile/upload",
    formData,
  );
  return res.data;
}

export function useBusinessUsers() {
  return useQuery({
    queryKey: ["business-users"],
    queryFn: async () => {
      const res = await api.get<BusinessUser[]>("/business/users");
      return res.data;
    },
    retry: false,
  });
}
