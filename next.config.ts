import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.FH_UI_TEST_DIST_DIR ? {
    distDir: process.env.FH_UI_TEST_DIST_DIR,
    agentRules: false,
    typescript: { tsconfigPath: `${process.env.FH_UI_TEST_DIST_DIR}.tsconfig.json` },
  } : {}),
};

export default nextConfig;
