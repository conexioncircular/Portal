"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppHeader, { PublicHeader, isPublicAppRoute } from "@/components/AppHeader";
import ClientProviders from "@/components/ClientProviders";

function Footer({ footerYear }: { footerYear: number }) {
  return (
    <footer className="border-t border-gray-200 bg-gray-100 px-4 py-6 text-center text-sm text-gray-600">
      <span>{`Copyright © ${footerYear}. Todos los derechos reservados.`}</span>
    </footer>
  );
}

export default function AppShell({
  children,
  footerYear,
}: {
  children: ReactNode;
  footerYear: number;
}) {
  const pathname = usePathname() || "/";
  const isLoginRoute = pathname === "/login";
  const isPublicRoute = isPublicAppRoute(pathname);

  if (isLoginRoute) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <Footer footerYear={footerYear} />
      </div>
    );
  }

  if (isPublicRoute) {
    return (
      <>
        <PublicHeader logoSrc="/LOGO-2.png" logoAlt="Conexion" pathname={pathname} />
        <div className="flex min-h-screen flex-col pt-16">
          <main className="flex-1">{children}</main>
          <Footer footerYear={footerYear} />
        </div>
      </>
    );
  }

  return (
    <ClientProviders>
      <AppHeader />
      <div className="flex min-h-screen flex-col pt-16">
        <main className="flex-1">{children}</main>
        <Footer footerYear={footerYear} />
      </div>
    </ClientProviders>
  );
}
