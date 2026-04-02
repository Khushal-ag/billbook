import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function validateEnv() {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
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
