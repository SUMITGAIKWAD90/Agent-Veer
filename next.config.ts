import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint:{
  //   ignoreDuringBuilds: true,
  // },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  serverExternalPackages: ["firebase-admin"],
  reactCompiler: true,
};

export default nextConfig;
