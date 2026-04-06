import { z } from "zod";
import { gstinString, panString } from "@/lib/validation-schemas";

const extraDetailSchema = z.object({
  key: z.string().trim().min(1, "Key is required"),
  value: z.string().trim(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  businessType: z.string().trim().max(100).optional().or(z.literal("")),
  industryType: z.string().trim().max(100).optional().or(z.literal("")),
  registrationType: z.string().trim().max(100).optional().or(z.literal("")),
  street: z.string().trim().max(500).optional().or(z.literal("")),
  area: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  pincode: z.string().trim().max(10).optional().or(z.literal("")),
  gstin: gstinString,
  pan: panString,
  financialYearStart: z.coerce.number().min(1).max(12).default(4),
  extraDetails: z.array(extraDetailSchema).optional().default([]),
  taxType: z.enum(["GST", "NON_GST"]).default("GST"),
  logoUrl: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
});

export type ProfileForm = z.infer<typeof profileSchema>;
export type ExtraDetailForm = z.infer<typeof extraDetailSchema>;
