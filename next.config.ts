import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // foto produk yang diunggah dari admin (Vercel Blob)
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  experimental: {
    // unggah foto produk lewat Server Action (batas bawaan 1 MB)
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
