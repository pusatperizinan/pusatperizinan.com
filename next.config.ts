import type { NextConfig } from "next";

// PUSATPERIZINAN.COM — konfigurasi Next.js.
// Build standar menghasilkan output standalone.
// Untuk hosting statis, gunakan BUILD_STATIC=1 agar output menjadi folder out/.
const isStaticExport = process.env.BUILD_STATIC === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {
        output: "standalone" as const,
      }),
  // Dipertahankan agar build tidak berhenti hanya karena error TypeScript.
  // Jalankan pemeriksaan TypeScript terpisah sebelum rilis produksi.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
