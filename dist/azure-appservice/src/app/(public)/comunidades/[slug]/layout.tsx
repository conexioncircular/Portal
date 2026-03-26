// src/app/(public)/comunidades/[slug]/layout.tsx
import type { Metadata } from "next";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import { getCommunityBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Comunidades | Conexión Circular",
  description: "Portal de comunidades del proyecto Conexión Circular",
};

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = (await (params as any)) as { slug: string };
  const comunidad = await getCommunityBySlug(String(slug ?? ""));
  const communityName = comunidad?.name || slug || "";
  return (
    <div className="relative min-h-screen flex flex-col bg-white text-gray-800">
      {/* 👇 NO RENDERIZAR AppHeader aquí (ya está en el layout raíz) */}

      {/* Contenido principal (con padding por el header fijo del layout raíz) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 py-6">
        {children}
      </main>

      {/* Botón flotante de WhatsApp */}
      <WhatsAppFloating phone="15793660415" communityName={communityName} />
    </div>
  );
}
