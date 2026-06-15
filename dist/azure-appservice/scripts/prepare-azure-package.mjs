import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const staticDir = path.join(rootDir, ".next", "static");
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(rootDir, "dist", "azure-appservice");
const outputPackageJson = path.join(outputDir, "package.json");

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

if (await exists(outputPackageJson)) {
  const packageJson = JSON.parse(await readFile(outputPackageJson, "utf8"));
  packageJson.scripts = {
    ...packageJson.scripts,
    start: "node server.js",
  };
  await writeFile(outputPackageJson, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

console.log(`Azure package ready at ${outputDir}`);
