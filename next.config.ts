import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Pin the workspace root. A stray package-lock.json in a parent directory
   * (/home/mohamed) otherwise makes Turbopack infer the wrong root and warn on
   * every build.
   */
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
