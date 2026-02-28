import { z } from "zod";

/**
 * Common validation schemas for reuse across forms
 */

// Price/amount validation (e.g., "0.00", "123.45")
export const priceString = z
  .string()
  .regex(/^$|^[0-9]+(\.[0-9]{1,2})?$/, "Invalid price/amount")
  .optional()
  .or(z.literal(""));

// Required price/amount validation (does not allow empty)
export const requiredPriceString = z
  .string()
  .regex(/^[0-9]+(\.[0-9]{1,2})?$/, "Enter a valid amount");

// Percentage validation (e.g., "0", "12.5", "100")
export const percentString = z
  .string()
  .regex(/^$|^\d+(\.\d{1,2})?$/, "Invalid percentage")
  .optional()
  .or(z.literal(""));

// Quantity validation (can be negative for stock adjustments)
export const quantityString = (allowNegative = false) =>
  z
    .string()
    .regex(
      allowNegative ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/,
      `Enter a valid quantity${allowNegative ? " (can be negative)" : ""}`,
    );

// Optional string field (can be empty)
export const optionalString = z.string().optional().or(z.literal(""));

// Email validation (optional)
export const optionalEmail = z.string().email("Invalid email").optional().or(z.literal(""));

// HSN Code (max 8 digits)
export const hsnCode = z.string().max(8, "HSN code max 8 digits").optional().or(z.literal(""));

// SAC Code (max 6 digits)
export const sacCode = z.string().max(6, "SAC code max 6 digits").optional().or(z.literal(""));

// Other tax name (max 100 chars, for taxType "OTHER")
export const otherTaxName = z.string().max(100, "Max 100 characters").optional().or(z.literal(""));

// GSTIN validation (15 characters)
export const gstinString = z
  .string()
  .regex(/^$|^[A-Z0-9]{15}$/, "GSTIN must be 15 characters")
  .optional()
  .or(z.literal(""));

// PAN validation (10 characters)
export const panString = z
  .string()
  .regex(/^$|^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
  .optional()
  .or(z.literal(""));

// Date string (ISO format YYYY-MM-DD)
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");
