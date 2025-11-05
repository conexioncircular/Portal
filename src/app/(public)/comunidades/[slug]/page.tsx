// app/(public)/comunidades/[slug]/page.tsx
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCommunityBySlug, getAllActiveSlugs } from "@/lib/data";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import CommunitySwitcher from "@/components/CommunitySwitcher";
import NewsGrid from "@/components/news/NewsGrid";

type ParamsShape = { slug: string };
type Props = { params: Promise<ParamsShape> | ParamsShape };

function normSlug(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv;

  // Vercel (ej. my-app.vercel.app)
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  // Fallback local
  return "http://localhost:3000";
}

async function fetchNews(slug: string) {
  const base = getBaseUrl();
  const url = new URL(`/api/communities/${slug}/news`, base);
  url.searchParams.set("limit", "6");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { items: [], total: 0 };
  return res.json();
}

export default async function ComunidadPage({ params }: Props) {
  const { slug } = (await params) as ParamsShape;
  const comunidad = await getCommunityBySlug(normSlug(slug));
  if (!comunidad || !comunidad.isActive) return notFound();

  const { items: newsItems } = await fetchNews(normSlug(slug));

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 relative">
      <CommunitySwitcher />

      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">{comunidad.name}</h1>
          <p className="text-gray-500">{comunidad.slug}</p>
        </header>

        

        {/* Noticias */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Noticias</h2>
          <NewsGrid items={newsItems} />
        </section>
      </div>

      <WhatsAppFloating
        phone="15793660415"
        preset={`Hola! Quiero reportar un problema en ${comunidad.name}.`}
      />
    </main>
  );
}

export async function generateStaticParams() {
  const slugs = await getAllActiveSlugs();
  return slugs.map((slug) => ({ slug: String(slug).toLowerCase() }));
}
