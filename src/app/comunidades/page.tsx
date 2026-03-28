import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const BRAND_DARK = "#343A50";
const BRAND_BLUE = "#19B5E8";
const BRAND_BLUE_SOFT = "#EAF8FD";

const comunidadItems = [
  "Impacto medible y alineado con los objetivos de responsabilidad social de la Compañía.",
  "Los resultados se pueden integrar estratégicamente con los KPI de desarrollo comunitario de la Compañía.",
  "Existe un monitoreo y evaluación constante del cumplimiento de metas.",
  "Se consolida el vínculo entre la comunidad y la Compañía.",
  "Se incrementa la satisfacción comunitaria gracias a un mejor acceso a servicios proporcionados.",
  "Mejora la empleabilidad local mediante la capacitación y contratación de miembros de la comunidad para prestar servicios y facilitar el acceso universal a los recursos, operando y gestionando la infraestructura.",
];

export default function ComunidadesPage() {
  return (
    <main className="min-h-screen bg-white text-[#23324a]">
      <section className="border-b border-[#e8eef2] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4b5563] transition hover:text-[#111827]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="mt-6 max-w-4xl">
            <p
              className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
              style={{ color: BRAND_BLUE }}
            >
              Comunidades
            </p>
            <h1 className="text-4xl font-bold md:text-6xl">
              Comunidad y Compañía Unidas
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#4b5563] md:text-xl">
              Un modelo de trabajo orientado a generar impacto real, fortalecer
              vínculos y acercar oportunidades a las comunidades.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid items-start gap-10 rounded-[32px] border border-[#e8eef2] bg-[#f8fbfc] p-6 shadow-sm md:grid-cols-[0.95fr_1.05fr] md:p-8">
          <div className="space-y-6 text-lg leading-relaxed text-[#23324a]">
            {comunidadItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>

          <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
            <Image
              src="/COMUNIDAD-COMPANIA.jpg"
              alt="Comunidad y Compañía Unidas"
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto flex max-w-7xl justify-center">
          <Image
            src="/LOGO-2.png"
            alt="Conexión Circular"
            width={360}
            height={120}
            className="h-auto w-[280px] object-contain md:w-[360px]"
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <div
            className="rounded-[30px] px-8 py-12 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.10)] md:px-14"
            style={{
              background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #2f3648 60%, ${BRAND_BLUE} 150%)`,
            }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
              Conexión Circular
            </p>

            <h2 className="text-3xl font-bold md:text-5xl">
              Juntos podemos conectar las comunidades al mundo
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/85 md:text-lg">
              Seguimos trabajando para acercar servicios, oportunidades y apoyo
              real a cada territorio.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/Oficina-movil"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-semibold text-[#111827] transition hover:opacity-95"
              >
                Ver Oficina Móvil
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                Ingresar a tu comunidad
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}