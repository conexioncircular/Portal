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
      <main className="flex-1 w-full">
        {children}
      </main>

      <WhatsAppFloating phone="15793660415" communityName={communityName} />
    </div>
  );
}