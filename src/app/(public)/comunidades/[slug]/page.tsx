export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import CommunityLogoDisplay from "@/components/community/CommunityLogoDisplay";
import NewsGrid from "@/components/news/NewsGrid";
import { getCommunityBySlug, listPublicCommunityNews } from "@/lib/data";

type ParamsShape = { slug: string };
type Props = { params: Promise<ParamsShape> | ParamsShape };

function normSlug(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

export default async function ComunidadPage({ params }: Props) {
  const { slug } = (await params) as ParamsShape;
  const normalizedSlug = normSlug(slug);

  const comunidad = await getCommunityBySlug(normalizedSlug);
  if (!comunidad || !comunidad.isActive) {
    return notFound();
  }

  const { items: newsItems } = await listPublicCommunityNews(comunidad.id, { limit: 6 });

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <section className="rounded-[2rem] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                {comunidad.name}
              </h1>
              <p className="mt-2 text-base text-slate-500">
                Novedades, actividades e información relevante para la comunidad.
              </p>
            </div>

            {comunidad.logoUrl ? (
              <CommunityLogoDisplay
                src={comunidad.logoUrl}
                alt={`Logo de ${comunidad.name}`}
                className="md:ml-6"
              />
            ) : null}
          </div>

          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Noticias</h2>
            <NewsGrid items={newsItems} communitySlug={normalizedSlug} />
          </div>
        </section>
      </div>

      <WhatsAppFloating phone="56988992435" communityName={comunidad.name} communitySlug={comunidad.slug} />
    </main>
  );
}
