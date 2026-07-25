import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

function safeHostnameFromUrl(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

const azureBlobHostname = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim()
  ? `${process.env.AZURE_STORAGE_ACCOUNT_NAME.trim()}.blob.core.windows.net`
  : null;

const imageHostnames = Array.from(
  new Set([
  "storage.googleapis.com",
  "content.r9cdn.net",
  "encrypted-tbn0.gstatic.com",
  "emmajeanstravels.com",
  "www.cascada.travel",
  "images.unsplash.com",
  "www.elzorronortino.cl",
  "agentechatnoticias.blob.core.windows.net",
    azureBlobHostname,
    safeHostnameFromUrl(process.env.AZURE_STORAGE_PUBLIC_BASE_URL),
  ].filter((hostname): hostname is string => Boolean(hostname)))
);

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    unoptimized: true,
    remotePatterns: imageHostnames.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default nextConfig;
