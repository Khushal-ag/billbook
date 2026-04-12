import { z } from "zod";

/** Same rules as signup / staff create (≥8, upper, lower, digit). */
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a digit");

export const signedPriceString = z
  .string()
  .regex(/^$|^-?[0-9]+(\.[0-9]{1,2})?$/, "Invalid price/amount")
  .optional()
  .or(z.literal(""));

/** Unsigned amount for opening balance (Debit/Credit chosen separately). */
export const unsignedPriceString = z
  .string()
  .regex(/^$|^[0-9]+(\.[0-9]{1,2})?$/, "Invalid amount")
  .optional()
  .or(z.literal(""));

export const requiredPriceString = z
  .string()
  .regex(/^[0-9]+(\.[0-9]{1,2})?$/, "Enter a valid amount")
  .refine((v) => parseFloat(v) > 0, "Amount must be greater than zero");

export const percentString = z
  .string()
  .regex(/^$|^\d+(\.\d{1,2})?$/, "Invalid percentage")
  .optional()
  .or(z.literal(""));

export const optionalString = z.string().optional().or(z.literal(""));

export const optionalEmail = z.string().email("Invalid email").optional().or(z.literal(""));

export const hsnCode = z.string().max(8, "HSN code max 8 digits").optional().or(z.literal(""));

export const sacCode = z.string().max(6, "SAC code max 6 digits").optional().or(z.literal(""));

export const otherTaxName = z.string().max(100, "Max 100 characters").optional().or(z.literal(""));

export const gstinString = z
  .string()
  .regex(/^$|^[A-Z0-9]{15}$/, "GSTIN must be 15 characters")
  .optional()
  .or(z.literal(""));

export const panString = z
  .string()
  .regex(/^$|^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
  .optional()
  .or(z.literal(""));
