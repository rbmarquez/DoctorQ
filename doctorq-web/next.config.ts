// Debug repeat removido após migração para nova estrutura
// import "./src/lib/debug-repeat";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const analyzeFlag = String(process.env.ANALYZE ?? "").toLowerCase();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: ["true", "both", "server", "browser", "json"].includes(analyzeFlag),
  openAnalyzer: false,
  analyzerMode:
    String(process.env.BUNDLE_ANALYZE_FORMAT ?? "").toLowerCase() === "json"
      ? "json"
      : "static",
});

const nextConfig: NextConfig = {
  /* config options here */
  // compress: true,
  poweredByHeader: false,
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    // !! IMPORTANT: Only use this for development/staging !!
    // Fix all TypeScript errors before production deployment
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "graph.microsoft.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "login.microsoftonline.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "iliabeauty.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
