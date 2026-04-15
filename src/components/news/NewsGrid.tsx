"use client";

import Image from "next/image";
import Link from "next/link";

type News = {
  NewsId: string;
  Title: string;
  Slug: string;
  Summary?: string | null;
  ImageUrl?: string | null;
  PublishedAt?: string | null;
  CreatedAt?: string | null;
  IsFeatured?: boolean;
};

type Props = {
  items: News[];
  communitySlug: string;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export default function NewsGrid({ items, communitySlug }: Props) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Aún no hay noticias en esta comunidad.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = items;

  return (
    <div className="space-y-8">
      <Link
        href={`/comunidades/${communitySlug}/noticias/${featured.Slug}`}
        className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.95fr]">
          <div className="relative min-h-[280px] bg-gray-100">
            {featured.ImageUrl ? (
              <Image
                src={featured.ImageUrl}
                alt={featured.Title}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                Sin imagen
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-3 p-6 md:p-7">
            {featured.IsFeatured ? (
              <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Destacada
              </span>
            ) : null}

            <p className="text-sm text-gray-500">
              {formatDate(featured.PublishedAt || featured.CreatedAt)}
            </p>

            <h3 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900">
              {featured.Title}
            </h3>

            {featured.Summary ? (
              <p className="text-[17px] leading-7 text-gray-600">
                {featured.Summary}
              </p>
            ) : null}

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#25d0c0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition group-hover:bg-[#1fc2b3]">
              Leer noticia
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </Link>

      {rest.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((n) => (
            <article
              key={n.NewsId}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link
                href={`/comunidades/${communitySlug}/noticias/${n.Slug}`}
                className="flex h-full flex-col"
              >
                <div className="relative aspect-[16/10] bg-gray-100">
                  {n.ImageUrl ? (
                    <Image
                      src={n.ImageUrl}
                      alt={n.Title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {formatDate(n.PublishedAt || n.CreatedAt)}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-[24px] font-semibold leading-snug text-gray-900">
                    {n.Title}
                  </h3>

                  {n.Summary ? (
                    <p className="mt-3 line-clamp-3 text-[16px] leading-6 text-gray-600">
                      {n.Summary}
                    </p>
                  ) : null}

                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#25d0c0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition group-hover:bg-[#1fc2b3]">
                    Leer más
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}