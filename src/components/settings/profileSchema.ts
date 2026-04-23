import { z } from "zod";
import { gstinString, panString } from "@/lib/core/validation-schemas";

const extraDetailSchema = z.object({
  key: z.string().trim().min(1, "Key is required"),
  value: z.string().trim(),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Business name is required").max(200),
    country: z.string().trim().max(100).optional().or(z.literal("")),
    email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{10}$/.test(v), {
        message: "Phone number must be exactly 10 digits when provided",
      }),
    businessType: z.string().trim().max(100).optional().or(z.literal("")),
    industryType: z.string().trim().max(100).optional().or(z.literal("")),
    registrationType: z.string().trim().max(100).optional().or(z.literal("")),
    street: z.string().trim().max(500).optional().or(z.literal("")),
    area: z.string().trim().max(200).optional().or(z.literal("")),
    city: z.string().trim().max(100).optional().or(z.literal("")),
    state: z.string().trim().max(100).optional().or(z.literal("")),
    pincode: z.string().trim().max(10).optional().or(z.literal("")),
    accountHolderName: z.string().trim().max(200).optional().or(z.literal("")),
    bankAccountNumber: z.string().trim().max(34).optional().or(z.literal("")),
    confirmAccountNumber: z.string().trim().max(34).optional().or(z.literal("")),
    bankName: z.string().trim().max(200).optional().or(z.literal("")),
    branchName: z.string().trim().max(200).optional().or(z.literal("")),
    bankCity: z.string().trim().max(100).optional().or(z.literal("")),
    bankState: z.string().trim().max(100).optional().or(z.literal("")),
    ifscCode: z.string().trim().max(11).optional().or(z.literal("")),
    transferAmount: z.string().trim().max(20).optional().or(z.literal("")),
    transferCurrency: z.string().trim().max(10).optional().or(z.literal("")),
    transferType: z.enum(["NEFT", "RTGS", "IMPS", "UPI"]).optional().or(z.literal("")),
    gstin: gstinString,
    pan: panString,
    financialYearStart: z.coerce.number().min(1).max(12).default(4),
    extraDetails: z.array(extraDetailSchema).optional().default([]),
    taxType: z.enum(["GST", "NON_GST"]).default("GST"),
    logoUrl: z.string().optional().nullable(),
    signatureUrl: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const street = (data.street ?? "").trim();
    const hasLocationDetail =
      (data.area ?? "").trim() !== "" ||
      (data.city ?? "").trim() !== "" ||
      (data.state ?? "").trim() !== "" ||
      (data.pincode ?? "").trim() !== "";
    if (hasLocationDetail && street === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["street"],
        message: "Address line 1 is required when pincode, area, city, or state is filled",
      });
    }

    const bankAccountNumber = (data.bankAccountNumber ?? "").trim();
    const confirmAccountNumber = (data.confirmAccountNumber ?? "").trim();
    const ifscCode = (data.ifscCode ?? "").trim();
    const accountHolderName = (data.accountHolderName ?? "").trim();
    const bankName = (data.bankName ?? "").trim();
    const branchName = (data.branchName ?? "").trim();
    const bankCity = (data.bankCity ?? "").trim();
    const bankState = (data.bankState ?? "").trim();
    const transferAmount = (data.transferAmount ?? "").trim();

    const hasAnyBankDetail =
      accountHolderName !== "" ||
      bankAccountNumber !== "" ||
      confirmAccountNumber !== "" ||
      ifscCode !== "" ||
      bankName !== "" ||
      branchName !== "" ||
      bankCity !== "" ||
      bankState !== "";

    if (hasAnyBankDetail) {
      if (accountHolderName === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountHolderName"],
          message: "Account holder name is required",
        });
      }

      if (bankAccountNumber === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankAccountNumber"],
          message: "Bank account number is required",
        });
      }

      if (confirmAccountNumber === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmAccountNumber"],
          message: "Confirm account number is required",
        });
      }

      if (ifscCode === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ifscCode"],
          message: "IFSC code is required",
        });
      }

      if (bankName === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "Bank name is required",
        });
      }

      if (branchName === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["branchName"],
          message: "Branch name is required",
        });
      }

      if (bankCity === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankCity"],
          message: "Bank city is required",
        });
      }

      if (bankState === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankState"],
          message: "Bank state is required",
        });
      }
    }

    if (bankAccountNumber !== "" && !/^\d{6,34}$/.test(bankAccountNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bankAccountNumber"],
        message: "Account number must be 6 to 34 digits",
      });
    }

    if (
      bankAccountNumber !== "" &&
      confirmAccountNumber !== "" &&
      bankAccountNumber !== confirmAccountNumber
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmAccountNumber"],
        message: "Account numbers do not match",
      });
    }

    if (ifscCode !== "" && !/^[A-Z0-9]{11}$/i.test(ifscCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ifscCode"],
        message: "IFSC code must be exactly 11 alphanumeric characters",
      });
    }

    if (transferAmount !== "") {
      const numericAmount = Number(transferAmount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transferAmount"],
          message: "Amount must be greater than 0",
        });
      }
    }
  });

export type ProfileForm = z.infer<typeof profileSchema>;
export type ExtraDetailForm = z.infer<typeof extraDetailSchema>;
