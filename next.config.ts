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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            /*
             * Required for ClickUp to frame the dashboard. Note there is no
             * X-Frame-Options header anywhere in this app — setting it to DENY
             * would override frame-ancestors in older browsers and break the
             * embed. Without an explicit frame-ancestors, any site could frame
             * us and read the URL key over the user's shoulder.
             */
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.clickup.com",
          },
          {
            /*
             * Direct mitigation for the DASHBOARD_SECRET-in-the-URL weakness:
             * without this, every outbound link and asset request would carry
             * ?k=<secret> in the Referer header to third parties.
             */
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
