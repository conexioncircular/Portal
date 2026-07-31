export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import CommunityLogoDisplay from "@/components/community/CommunityLogoDisplay";
import NewsImageCarousel, {
  type PublicNewsImage,
} from "@/components/news/NewsImageCarousel";
import { getCommunityBySlug, getPublicCommunityNewsDetail } from "@/lib/data";

type ParamsShape = { slug: string; newsSlug: string };
type Props = { params: Promise<ParamsShape> | ParamsShape };

function normSlug(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function NoticiaDetallePage({ params }: Props) {
  const { slug, newsSlug } = (await params) as ParamsShape;

  const communitySlug = normSlug(slug);
  const normalizedNewsSlug = normSlug(newsSlug);

  const comunidad = await getCommunityBySlug(communitySlug);
  if (!comunidad || !comunidad.isActive) {
    return notFound();
  }

  const item = await getPublicCommunityNewsDetail(comunidad.id, normalizedNewsSlug);
  if (!item) {
    return notFound();
  }

  const storedImages: PublicNewsImage[] = [...(item.Images ?? [])]
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.newsImageId.localeCompare(right.newsImageId)
    )
    .map((image) => ({
      newsImageId: image.newsImageId,
      imageUrl: image.imageUrl,
      caption: image.caption,
      sortOrder: image.sortOrder,
      isCover: image.isCover,
    }));
  const carouselImages: PublicNewsImage[] =
    storedImages.length > 0
      ? storedImages
      : item.ImageUrl
        ? [
            {
              newsImageId: `legacy-${item.NewsId}`,
              imageUrl: item.ImageUrl,
              caption: null,
              sortOrder: 1,
              isCover: true,
            },
          ]
        : [];

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <div>
          <Link
            href={`/comunidades/${communitySlug}`}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <span aria-hidden="true">←</span>
            Volver a {comunidad.name}
          </Link>
        </div>

        <article className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          {carouselImages.length > 0 ? (
            <NewsImageCarousel
              images={carouselImages}
              newsTitle={item.Title}
            />
          ) : null}

          <div className="space-y-6 p-6 md:p-12">
            <header className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    {formatDate(item.PublishedAt || item.CreatedAt)}
                  </p>

                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
                    {item.Title}
                  </h1>

                  {item.Summary ? (
                    <p className="max-w-3xl text-lg leading-8 text-gray-600">
                      {item.Summary}
                    </p>
                  ) : null}
                </div>

                {comunidad.logoUrl ? (
                  <CommunityLogoDisplay
                    src={comunidad.logoUrl}
                    alt={`Logo de ${comunidad.name}`}
                    className="shrink-0 md:ml-8"
                  />
                ) : null}
              </div>
            </header>

            {item.BodyHtml ? (
              <div
                className="news-content max-w-none text-[17px] leading-8 text-gray-700"
                dangerouslySetInnerHTML={{ __html: item.BodyHtml }}
              />
            ) : (
              <p className="text-gray-600">Esta noticia no tiene contenido adicional.</p>
            )}
          </div>
        </article>
      </div>

      <WhatsAppFloating phone="56988992435" communityName={comunidad.name} communitySlug={comunidad.slug} />
    </main>
  );
}
