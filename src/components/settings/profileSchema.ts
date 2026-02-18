import { z } from "zod";

export const profileSchema = z.object({
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

export type ProfileForm = z.infer<typeof profileSchema>;
