import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WhatsAppFloating from "../../components/WhatsAppFloating";

type Comunidad = {
  slug: string;
  nombre: string;
};

type Noticia = {
  id: string;
  titulo: string;
  fecha: string; // ISO
  contenidoHtml: string; // HTML seguro
};

type NewsMap = Record<string, Noticia[]>;

async function readJson<T>(...segments: string[]): Promise<T> {
  const filePath = path.join(process.cwd(), ...segments);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(
      new Date(date)
    );
  } catch {
    return date;
  }
}

function normalizeSlug(input: string) {
  const withHyphens = input
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-");
  const noAccents = withHyphens.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
  return noAccents.toLowerCase();
}

async function getComunidades(): Promise<Comunidad[]> {
  const raw = await readJson<any>("data", "communities.json");
  if (Array.isArray(raw)) {
    return raw.map((c: any, i: number) => {
      const originalSlug: string = c.slug ?? `comunidad-${i}`;
      const nombre: string = c.nombre ?? c.name ?? String(c.title ?? originalSlug);
      return { slug: normalizeSlug(originalSlug), nombre };
    });
  }
  return [];
}

async function getNewsMap(): Promise<NewsMap> {
  const raw = await readJson<any>("data", "news.json");
  const map: NewsMap = {};
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      const normalized = normalizeSlug(key);
      const list: any[] = Array.isArray(raw[key]) ? raw[key] : [];
      map[normalized] = list.map((item: any, idx: number) => ({
        id: String(item.id ?? `${normalized}-${idx}`),
        titulo: String(item.titulo ?? item.title ?? ""),
        fecha: String(item.fecha ?? item.publishedAt ?? ""),
        contenidoHtml: String(item.contenidoHtml ?? item.html ?? ""),
      }));
    }
  }
  return map;
}

// SSG: pre-genera todas las rutas por comunidad
export async function generateStaticParams() {
  const comunidades = await getComunidades();
  return comunidades.map((c) => ({ slug: c.slug }));
}

// SEO bÃ¡sico por comunidad
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comunidades = await getComunidades();
  const comunidad =
    comunidades.find((c) => c.slug === slug) ||
    comunidades.find((c) => c.slug === normalizeSlug(slug));
  if (!comunidad) {
    return {
      title: "Comunidad no encontrada",
      description: "No encontramos la comunidad solicitada.",
    };
  }
  return {
    title: `${comunidad.nombre} | Conexi\u00F3n Circular`,
    description: `Noticias de ${comunidad.nombre}`,
    openGraph: {
      title: `${comunidad.nombre} | Conexi\u00F3n Circular`,
      description: `Noticias y avisos de ${comunidad.nombre}`,
      type: "website",
    },
  };
}export default async function ComunidadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comunidades = await getComunidades();
  const newsMap = await getNewsMap();

  // Busca por slug exacto, y si llega en otro formato, normaliza y redirige
  let comunidad = comunidades.find((c) => c.slug === slug);
  if (!comunidad) {
    const normalized = normalizeSlug(slug);
    comunidad = comunidades.find((c) => c.slug === normalized);
    if (comunidad) {
      redirect(`/${comunidad.slug}`);
    }
  }

  if (!comunidad) {
    // 404 con CTA a inicio
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Comunidad no encontrada
          </h1>
          <p className="mt-3 text-gray-600">No encontramos la comunidad “{slug}”.</p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-white font-semibold shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </main>
    );
  }

  const noticias = newsMap[comunidad.slug] || [];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {comunidad.nombre}
          </h1>
          <p className="mt-2 text-gray-600">Noticias de la comunidad</p>
        </header>

        <section className="mt-8 space-y-4">
          {noticias.length === 0 ? (
            <div className="text-center text-gray-600">No hay noticias a\u00FAn</div>
          ) : (
            noticias.map((n) => (
              <article
                key={n.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900">{n.titulo}</h3>
                <p className="mt-1 text-sm text-gray-500">{formatDate(n.fecha)}</p>
                <div
                  className="prose prose-sm sm:prose-base mt-3 text-gray-700"
                  dangerouslySetInnerHTML={{ __html: n.contenidoHtml || "" }}
                />
              </article>
            ))
          )}
        </section>

        <div className="mt-10 text-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-white font-semibold shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Volver al inicio
          </a>
        </div>
      </div>
      <WhatsAppFloating phone="15793660415" preset={`Hola! Quiero reportar un problema en ${comunidad.nombre}.`} />
    </main>
  );
}














