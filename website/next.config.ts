import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for a lean Docker image — see website/Dockerfile.
  output: "standalone",
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;
