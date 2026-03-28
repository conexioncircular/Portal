import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServiceBySlug, servicePages } from "@/lib/service-pages";

const BRAND_BLUE = "#19B5E8";
const BRAND_BLUE_SOFT = "#EAF8FD";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return servicePages.map((service) => ({
    slug: service.slug,
  }));
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) notFound();

  return (
    <main className="min-h-screen bg-white text-[#23324a]">
      <section className="border-b border-[#e8eef2] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4b5563] transition hover:text-[#111827]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="mt-6 max-w-4xl">
            {service.eyebrow && (
              <p
                className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
                style={{ color: BRAND_BLUE }}
              >
                {service.eyebrow}
              </p>
            )}

            <h1 className="text-4xl font-bold md:text-6xl">{service.title}</h1>

            {service.summary && (
              <p className="mt-5 text-lg leading-8 text-[#4b5563] md:text-xl">
                {service.summary}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid items-center gap-10 rounded-[32px] border border-[#e8eef2] bg-[#f8fbfc] p-6 shadow-sm md:grid-cols-[1.05fr_0.95fr] md:p-8">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
              {service.mediaType === "video" ? (
                <video
                  controls
                  playsInline
                  className="h-auto w-full object-cover"
                  poster={service.poster}
                >
                  <source src={service.mediaSrc} type="video/mp4" />
                  Tu navegador no soporta video.
                </video>
              ) : (
                <Image
                  src={service.mediaSrc}
                  alt={service.title}
                  width={1200}
                  height={900}
                  className="h-auto w-full object-cover"
                />
              )}
            </div>

            <div>
              <p
                className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
                style={{ color: BRAND_BLUE }}
              >
                {service.title}
              </p>

              <div className="space-y-8 text-xl leading-relaxed text-[#23324a] md:text-2xl">
                {service.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <div
            className="rounded-[30px] border border-[#dcecf3] px-8 py-12 text-center shadow-sm"
            style={{ backgroundColor: BRAND_BLUE_SOFT }}
          >
            <p
              className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
              style={{ color: BRAND_BLUE }}
            >
              Conexión Circular
            </p>

            <h2 className="text-3xl font-bold md:text-5xl">
              Servicios pensados para acompañar a la comunidad
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#4b5563] md:text-lg">
              Conoce los distintos apoyos disponibles y encuentra el servicio que
              mejor responda a tus necesidades.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#cfe7f2] bg-white px-7 py-4 text-lg font-semibold text-[#23324a] transition hover:bg-[#f8fbfc]"
              >
                Volver al inicio
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#343A50] px-7 py-4 text-lg font-semibold text-white transition hover:opacity-95"
              >
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}