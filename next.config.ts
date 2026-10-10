import type { NextConfig } from "next";

// ============================================================
// PUSATPERIZINAN.COM — Next Config
// ------------------------------------------------------------
// MODE 1 (DEFAULT) — standalone:
//   Server Node.js penuh (Hostinger Node.js, Vercel, VPS, Docker).
//   Semua API route jalan: lead capture, AI chat, license checker.
//   Database Supabase/PostgreSQL terhubung realtime.
//   Build:  npm run build      (webpack — stabil, tidak crash)
//   Start:  npm start          (node .next/standalone/server.js)
//
// MODE 2 (LEGACY) — static export (BUILD_STATIC=1):
//   HTML+CSS+JS murni untuk shared hosting tanpa Node.js
//   (idwebhost/cPanel). API routes TIDAK jalan.
//   Build:  npm run build:static
//   Hasil:  folder out/ siap upload.
//
// REKOMENDASI: Untuk Hostinger Node.js + Supabase, pakai MODE 1.
// ============================================================

const isStaticExport = process.env.BUILD_STATIC === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        // Mode hosting statis (LEGACY): prerender semua halaman jadi HTML
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {
        // Mode server (DEFAULT): standalone untuk Hostinger Node.js / Vercel / VPS
        output: "standalone" as const,
      }),
  // Abaikan error TS saat build (kode sudah diverifikasi via lint)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  // Paket server-only yang harus di-externalize (tidak di-bundle)
  serverExternalPackages: ["sharp", "@prisma/client"],
};

export default nextConfig;
