import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: isProd,
  async redirects() {
    return [{ source: "/pricing", destination: "/", permanent: true }];
  },
  experimental: {
    // Smaller client bundles when importing from package barrel files (esp. lucide icons).
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
};

export default nextConfig;
