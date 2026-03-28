import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, MonitorSmartphone, Wifi } from "lucide-react";

const BRAND_DARK = "#343A50";
const BRAND_BLUE = "#19B5E8";
const BRAND_BLUE_SOFT = "#EAF8FD";

export default function OficinaMovilPage() {
  return (
    <main className="min-h-screen bg-white text-[#23324a]">
      {/* ENCABEZADO */}
      <section className="border-b border-[#e8eef2] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4b5563] transition hover:text-[#111827]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="mt-6 max-w-3xl">
            <p
              className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
              style={{ color: BRAND_BLUE }}
            >
              Módulo EcoConnect
            </p>

            <h1 className="text-4xl font-bold md:text-6xl">
              Oficina Móvil en tu Comunidad
            </h1>

            <p className="mt-5 text-lg leading-8 text-[#4b5563] md:text-xl">
              Módulo que proporciona conectividad y acceso a servicios básicos.
            </p>
          </div>
        </div>
      </section>

      {/* BLOQUE PRINCIPAL */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid items-center gap-10 rounded-[32px] border border-[#e8eef2] bg-[#f8fbfc] p-6 shadow-sm md:grid-cols-[1.05fr_0.95fr] md:p-8">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
              <video
                controls
                playsInline
                className="h-auto w-full object-cover"
                poster="/OFICINA-MOVIL.jpg"
              >
                <source src="/OFICINA-MOVIL.mp4" type="video/mp4" />
                Tu navegador no soporta video.
              </video>
            </div>

            <div>
              <p
                className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
                style={{ color: BRAND_BLUE }}
              >
                Oficina móvil
              </p>

              <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                Oficina Móvil en tu Comunidad
              </h2>

              <div className="mt-8 space-y-4 text-xl font-medium md:text-3xl">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-6 w-6 shrink-0" style={{ color: BRAND_BLUE }} />
                  <span>Río Jorquera</span>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-1 h-6 w-6 shrink-0" style={{ color: BRAND_BLUE }} />
                  <span>15/10 - 15/12</span>
                </div>
              </div>

              <p className="mt-10 max-w-2xl text-xl font-semibold leading-tight md:text-3xl">
                Esta oficina tendrá un computador e internet para que te conectes
                con nosotros y resolvamos todas tus consultas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-[#e8eef2] bg-white p-6 shadow-sm">
              <div
                className="mb-4 inline-flex rounded-2xl p-3"
                style={{ backgroundColor: BRAND_BLUE_SOFT }}
              >
                <Wifi className="h-6 w-6" style={{ color: BRAND_BLUE }} />
              </div>
              <h3 className="text-xl font-semibold">Conectividad</h3>
              <p className="mt-3 text-base leading-7 text-[#4b5563]">
                Acceso a internet y herramientas digitales directamente en terreno.
              </p>
            </div>

            <div className="rounded-[26px] border border-[#e8eef2] bg-white p-6 shadow-sm">
              <div
                className="mb-4 inline-flex rounded-2xl p-3"
                style={{ backgroundColor: BRAND_BLUE_SOFT }}
              >
                <MonitorSmartphone className="h-6 w-6" style={{ color: BRAND_BLUE }} />
              </div>
              <h3 className="text-xl font-semibold">Atención y apoyo</h3>
              <p className="mt-3 text-base leading-7 text-[#4b5563]">
                Un espacio para conectarte con nosotros y resolver tus consultas.
              </p>
            </div>

            <div className="rounded-[26px] border border-[#e8eef2] bg-white p-6 shadow-sm">
              <div
                className="mb-4 inline-flex rounded-2xl p-3"
                style={{ backgroundColor: BRAND_BLUE_SOFT }}
              >
                <MapPin className="h-6 w-6" style={{ color: BRAND_BLUE }} />
              </div>
              <h3 className="text-xl font-semibold">Presencia local</h3>
              <p className="mt-3 text-base leading-7 text-[#4b5563]">
                Acercamos servicios básicos y orientación directamente a la comunidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL SUAVE */}
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
              Conectividad y apoyo donde más se necesita
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#4b5563] md:text-lg">
              La Oficina Móvil busca acercar servicios, orientación y conectividad
              a las comunidades, facilitando el acceso y resolviendo consultas en terreno.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-lg font-semibold text-white transition hover:opacity-95"
                style={{ backgroundColor: BRAND_DARK }}
              >
                Volver al inicio
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[#cfe7f2] bg-white px-7 py-4 text-lg font-semibold text-[#23324a] transition hover:bg-[#f8fbfc]"
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