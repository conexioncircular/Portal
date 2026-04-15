export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/data";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import NewsGrid from "@/components/news/NewsGrid";

type ParamsShape = { slug: string };
type Props = { params: Promise<ParamsShape> | ParamsShape };

function normSlug(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

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
  const normalizedSlug = normSlug(slug);

  const comunidad = await getCommunityBySlug(normalizedSlug);
  if (!comunidad || !comunidad.isActive) return notFound();

  const { items: newsItems } = await fetchNews(normalizedSlug);

  return (
  <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 md:px-6 md:py-8">
    <div className="mx-auto w-full max-w-6xl">
      <section className="rounded-[2rem] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 md:px-10 md:py-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            {comunidad.name}
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Novedades, actividades e información relevante para la comunidad.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Noticias</h2>
          <NewsGrid items={newsItems} communitySlug={normalizedSlug} />
        </div>
      </section>
    </div>

    
  </main>
);
}