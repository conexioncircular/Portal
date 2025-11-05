// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { promises as fs } from "fs";
import path from "path";

// 👇 Header cliente que usa useSession
import AppHeader from "@/components/AppHeader";
// 👇 Proveedor de sesión (client)
import ClientProviders from "@/components/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ✅ Proveedores cliente (SessionProvider) */}
        <ClientProviders>
          {/* ✅ Header cliente, sin props (usa useSession) */}
          <AppHeader />

          <div className="min-h-screen flex flex-col pt-16">
            <main className="flex-1">{children}</main>

            <footer className="bg-gray-100 border-t border-gray-200 px-4 py-6 text-center text-sm text-gray-600">
              {footerHtml ? (
                <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
              ) : (
                <span suppressHydrationWarning>
                  © {new Date().getFullYear()} Conexión Circular
                </span>
              )}
            </footer>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
