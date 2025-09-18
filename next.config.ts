import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/gdm-frontview",
  assetPrefix: "/gdm-frontview",
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add rule for WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    return config;
  },
};

export default nextConfig;
