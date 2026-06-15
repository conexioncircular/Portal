// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { promises as fs } from "fs";
import path from "path";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Conexión Circular",
  description: "Tu canal directo para reportes y novedades",
};

async function readFooter(): Promise<string> {
  try {
    const p = path.join(process.cwd(), "data", "snippets", "footer.es-ES.html");
    return await fs.readFile(p, "utf8");
  } catch {
    return "";
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const footerHtml = await readFooter();
  const footerYear = new Date().getFullYear();

  return (
    <html lang="es">
      <body className="antialiased">
        <AppShell footerHtml={footerHtml} footerYear={footerYear}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
