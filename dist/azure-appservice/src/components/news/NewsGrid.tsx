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

export default function NewsGrid({ items }: { items: News[] }) {
  if (!items?.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay noticias en esta comunidad.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((n) => (
        <article key={n.NewsId} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          {n.ImageUrl && (
            <div className="aspect-[16/9] relative">
              <Image src={n.ImageUrl} alt={n.Title} fill className="object-cover" />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold leading-tight line-clamp-2">{n.Title}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              {(n.PublishedAt || n.CreatedAt) &&
                new Date(n.PublishedAt || n.CreatedAt!).toLocaleDateString()}
            </div>
            {n.Summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{n.Summary}</p>}
            <Link
              href={`./noticias/${n.Slug}`}
              className="mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              Leer más
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
