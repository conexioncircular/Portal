"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
  Stethoscope,
  BriefcaseBusiness,
  GraduationCap,
} from "lucide-react";
import MediaBlock from "../../components/MediaBlock";

const BRAND_DARK = "#1E1A1D";
const BRAND_BLUE = "#19B5E8";
const BRAND_BLUE_SOFT = "#EAF8FD";

const serviceItems = [
  { label: "Orientación Primaria de Salud", href: "/servicios/orientacion-primaria-salud", icon: Stethoscope },
  { label: "Apoyo Legal Personal", href: "/servicios/apoyo-legal-personal", icon: BriefcaseBusiness },
  { label: "Apoyo Psicológico Individual", href: "/servicios/apoyo-psicologico-individual", icon: Users },
  { label: "Apoyo Psicológico Laboral", href: "/servicios/apoyo-psicologico-laboral", icon: Users },
  { label: "Apoyo Educacional Integral", href: "/servicios/apoyo-educacional-integral", icon: GraduationCap },
  { label: "Asesoría Fomento Productivo", href: "/servicios/asesoria-fomento-productivo", icon: Sparkles },
  { label: "Agenda Comunitaria", href: "/servicios/agenda-comunitaria", icon: Users },
  { label: "Puntos de Conectividad", href: "/servicios/puntos-de-conectividad", icon: Wifi },
  { label: "Acceso Universal", href: "/servicios/acceso-universal", icon: ShieldCheck },
];

const valueCards = [
  {
    title: "Atención integral",
    text: "Salud, apoyo legal, acompañamiento emocional y orientación personalizada.",
  },
  {
    title: "Tecnología con propósito",
    text: "Soluciones digitales para conectar personas, servicios y oportunidades.",
  },
  {
    title: "Impacto sostenible",
    text: "Una propuesta pensada para generar bienestar y relaciones duraderas.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-white text-[#111827]">
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/PAGINA-PRINCIPAL.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 38%, rgba(0,0,0,0.58) 100%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center text-white md:min-h-[78vh]">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold backdrop-blur"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: BRAND_BLUE }}
            />
            Conexión Circular
          </div>

          <h1 className="max-w-5xl text-4xl font-extrabold leading-tight md:text-6xl">
            CONECTANDO COMUNIDADES AL MUNDO PARA TRANSFORMAR SUS VIDAS
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/85 md:text-xl">
            Soluciones comunitarias, apoyo profesional y conectividad para acercar
            servicios a quienes más lo necesitan.
          </p>
        </div>
      </section>

      <section id="comunidades" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-36">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
            style={{ color: BRAND_BLUE }}
          >
            Servicios disponibles
          </p>
          <h2 className="text-3xl font-bold text-[#111827] md:text-5xl">
            Apoyo integral para comunidades
          </h2>
          <p className="mt-4 text-base leading-7 text-[#4b5563] md:text-lg">
            Accede a orientación, acompañamiento y herramientas para fortalecer
            el bienestar y el desarrollo comunitario.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {serviceItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-[26px] border border-[#e8eef2] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: index % 2 === 0 ? BRAND_BLUE_SOFT : "#F7F9FA" }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: index % 2 === 0 ? BRAND_BLUE : BRAND_DARK }}
                    />
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#94a3b8] transition group-hover:translate-x-1" />
                </div>

                <h3 className="text-lg font-semibold leading-7 text-[#111827]">
                  {item.label}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#4b5563]">
                  Conoce este servicio y revisa la información disponible para tu comunidad.
                </p>

                <div
                  className="mt-5 h-1.5 w-16 rounded-full transition group-hover:w-24"
                  style={{ backgroundColor: BRAND_BLUE }}
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f8fbfc] py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[30px] border border-[#e8eef2] bg-white shadow-[0_16px_50px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[#eef3f6] px-6 py-4">
              <p
                className="text-sm font-semibold uppercase tracking-[0.25em]"
                style={{ color: BRAND_BLUE }}
              >
                Plataforma digital comunitaria
              </p>
            </div>
            <video
              src="/principal.mp4"
              controls
              className="h-auto w-full"
              poster="/PAGINA-PRINCIPAL.jpg"
            >
              Tu navegador no soporta el video.
            </video>
          </div>

          <div className="flex flex-col justify-center">
            <div className="rounded-[30px] border border-[#e8eef2] bg-white p-8 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Conexión Circular
              </p>

              <h2 className="text-3xl font-bold text-[#111827]">
                Solución tecnológica para el desarrollo y apoyo de comunidades aisladas
              </h2>

              <p className="mt-5 text-[17px] leading-8 text-[#334155]">
                Es un mundo de soluciones tecnológicas sustentables que pone a disposición
                de las comunidades rurales un equipo multidisciplinario de profesionales
                destinado exclusivamente a atender sus necesidades.
              </p>

              <p className="mt-4 text-[17px] leading-8 text-[#334155]">
                Durante todo el proceso se afianzan los vínculos entre los integrantes
                de la comunidad y tu compañía, mejorando sus oportunidades de crecimiento.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {valueCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-[#e8eef2] bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-[#111827]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4b5563]">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[34px] bg-white">
            <MediaBlock
              title="Nuestro Equipo"
              bullets={[
                "Más de 20 años de experiencia en comunidades críticas.",
                "Apoyo con tecnología de clase mundial.",
                "Vínculos y confianza con la comunidad y tu compañía.",
              ]}
              image={{ src: "/NOSOTROS.jpg", alt: "Nuestro equipo" }}
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f8fbfc] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[34px] border border-[#e8eef2] bg-white/80 p-1 shadow-sm">
            <MediaBlock
              title="Plataforma Digital Comunitaria"
              bullets={[
                "Atención en línea de profesionales.",
                "Orientación primaria de salud y apoyo legal/psicológico.",
                "Agenda comunitaria e impulso al fomento productivo.",
              ]}
              image={{ src: "/PROFESIONALES.jpg", alt: "Plataforma y profesionales" }}
              imageRight
            />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[34px] bg-white">
            <MediaBlock
              title="Módulo EcoConnect"
              bullets={[
                "Conectividad y acceso a servicios básicos.",
                "Infraestructura operada con participación local.",
              ]}
              image={{ src: "/MODULO.jpg", alt: "Módulo EcoConnect" }}
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f8fbfc] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[34px] border border-[#e8eef2] bg-white/80 p-1 shadow-sm">
            <MediaBlock
              title="Comunidad y Compañía Unidas"
              bullets={[
                "Impacto medible alineado a KPI de desarrollo comunitario.",
                "Monitoreo y evaluación constante de metas.",
                "Mayor satisfacción y empleabilidad local.",
              ]}
              image={{ src: "/P12.jpg", alt: "Comunidad y compañía" }}
              imageRight
            />
          </div>
        </div>
      </section>

      <section className="pb-24 pt-6">
        <div className="mx-auto max-w-5xl px-6">
          <div
            className="rounded-[34px] px-8 py-12 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:px-14"
            style={{
              background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #2c2629 55%, ${BRAND_BLUE} 140%)`,
            }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
              Conexión Circular
            </p>
            <h2 className="text-3xl font-bold md:text-5xl">
              Servicios y apoyo pensados para transformar comunidades
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/85 md:text-lg">
              Explora la plataforma, conoce los servicios disponibles y accede al
              acompañamiento que tu comunidad necesita.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  const section = document.getElementById("comunidades");
                  section?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-semibold text-[#111827] transition hover:opacity-95"
              >
                Ver servicios
                <ArrowRight className="h-5 w-5" />
              </button>

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