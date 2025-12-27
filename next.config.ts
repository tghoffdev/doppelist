import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // COOP/COEP headers disabled for Phase 1 (MRAID rendering)
  // These block cross-origin ad resources from loading
  // Re-enable in Phase 3 when implementing recording with FFmpeg WASM
  //
  // async headers() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  //         { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
