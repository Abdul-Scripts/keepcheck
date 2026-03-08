import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // output: "export",
  images: {
    unoptimized: true,
  },
  // basePath: "/keepcheck",
  // assetPrefix: "/keepcheck",
};

export default nextConfig;
