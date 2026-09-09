import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for the Docker image in website/Dockerfile. Netlify's
  // Next.js plugin does not need it. Vercel 16.3 packaging fails when it
  // is on (ENOENT next-server.js.nft.json), so skip it on Vercel only.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // Gallery lat/lng is public; street numbers must never appear in shipped maps.
  productionBrowserSourceMaps: false,
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;
