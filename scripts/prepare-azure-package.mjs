import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const staticDir = path.join(rootDir, ".next", "static");
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(rootDir, "dist", "azure-appservice");

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(standaloneDir))) {
  throw new Error(
    "No existe .next/standalone. Ejecuta `npm run build` antes de preparar el paquete."
  );
}

await rm(outputDir, { recursive: true, force: true });
await cp(standaloneDir, outputDir, { recursive: true });

if (await exists(staticDir)) {
  await mkdir(path.join(outputDir, ".next"), { recursive: true });
  await cp(staticDir, path.join(outputDir, ".next", "static"), {
    recursive: true,
  });
}

if (await exists(publicDir)) {
  await cp(publicDir, path.join(outputDir, "public"), { recursive: true });
}

console.log(`Azure package ready at ${outputDir}`);
