import { z } from "zod";

/** Treat empty .env values as unset so optional vars validate cleanly. */
function emptyToUndefined(v: unknown) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL when set").optional(),
  ),
  NEXT_PUBLIC_CONTACT_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email("NEXT_PUBLIC_CONTACT_EMAIL must be a valid email when set").optional(),
  ),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function validateEnv() {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    throw new Error(`❌ Invalid environment variables:\n${message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export const env = new Proxy({} as Env, {
  get(_target, prop) {
    return validateEnv()[prop as keyof Env];
  },
});
