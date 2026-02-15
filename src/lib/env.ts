import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url("VITE_API_BASE_URL must be a valid URL"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    throw new Error(`❌ Invalid environment variables:\n${message}`);
  }

  return parsed.data;
}

export const env = validateEnv();
