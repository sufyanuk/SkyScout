import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Tree-shake icon imports so only the icons we use ship to the browser.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
