import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for a lean Docker image — see website/Dockerfile.
  output: "standalone",
  // Gallery lat/lng is public; street numbers must never appear in shipped maps.
  productionBrowserSourceMaps: false,
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;
