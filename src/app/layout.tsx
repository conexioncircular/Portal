// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Conexión Circular",
  description: "Tu canal directo para reportes y novedades",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const footerYear = new Date().getFullYear();

  return (
    <html lang="es">
      <body className="antialiased">
        <AppShell footerYear={footerYear}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
