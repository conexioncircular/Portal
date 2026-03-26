import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const imageHostnames = [
  "storage.googleapis.com",
  "content.r9cdn.net",
  "encrypted-tbn0.gstatic.com",
  "emmajeanstravels.com",
  "www.cascada.travel",
];

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: imageHostnames.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default nextConfig;