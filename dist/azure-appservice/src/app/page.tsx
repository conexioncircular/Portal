import CenteredLogo from "../../components/CenteredLogo";
import HeroBanner from "../../components/HeroBanner";
import CtaMatrix from "../../components/CtaMatrix";
import MediaBlock from "../../components/MediaBlock";
import WhatsAppFloating from "../components/WhatsAppFloating";

export default function HomePage() {
  return (
    <main className="pt-16">
      

     

      {/* HERO + CTA */}
      <section className="section">
        <HeroBanner
          title="CONECTANDO COMUNIDADES AL MUNDO PARA TRANSFORMAR SUS VIDAS"
          background="/PAGINA-PRINCIPAL.jpg"
          ctas={[
            { label: "Ingresa a tu Comunidad", href: "/login", variant: "primary" },
          ]}
          styleButton={{
            background: "#0f172a",
            color: "white",
            fontWeight: 700,
            boxShadow: "0 6px 24px rgba(2,6,23,.06), 0 2px 8px rgba(2,6,23,.04)",
            borderRadius: "12px",
            padding: "12px 18px",
          }}
        />
      </section>

      {/* MATRIZ 3x3 */}
      <section className="section section-pad">
        <CtaMatrix
          items={[
            { label: "Orientación Primaria de Salud", href: "/Orientación-Primaria-Salud" },
            { label: "Apoyo Legal Personal", href: "/Capacitaciones" },
            { label: "Apoyo Psicológico Individual", href: "/Noticias" },
            { label: "Apoyo Psicológico Laboral", href: "/HorasMedicas" },
            { label: "Apoyo Educacional Integral", href: "/Capacitaciones" },
            { label: "Asesoría Fomento Productivo", href: "/Noticias" },
            { label: "Agenda Comunitaria", href: "/HorasMedicas" },
            { label: "Puntos de Conectividad", href: "/PuntosConectividad" },
            { label: "Acceso Universal", href: "/AccesoUniversal" },
          ]}
        />
      </section>

      {/* TÍTULO + VIDEO + MENSAJE */}
      <section className="section section-pad text-center">
        <h2 className="h2-elegant text-3xl md:text-5xl mb-8">
          Solución tecnológica para el desarrollo y apoyo de comunidades aisladas
        </h2>

        <div className="mx-auto max-w-3xl card overflow-hidden">
          <video
            src="/principal.mp4"
            controls
            className="w-full h-auto"
            poster="/PAGINA-PRINCIPAL.jpg"
          >
            Tu navegador no soporta el video.
          </video>
        </div>

        {/* Mensaje institucional — estilo ejecutivo */}
        <div className="mx-auto max-w-3xl mt-10 animate-fadeIn">
          <div className="card ring-card">
            <div className="px-6 py-7 md:py-8 text-left">
              <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">
                Conexión Circular
              </p>
              <p className="text-[17px] md:text-lg leading-8 text-slate-800 dark:text-slate-200">
                Es un mundo de soluciones tecnológicas sustentables que pone a disposición de las comunidades rurales un equipo multidisciplinario de profesionales destinado exclusivamente a atender sus necesidades. Durante todo el proceso se afianzan los vínculos entre los integrantes de la comunidad y tu Compañía, mejorando sus oportunidades de crecimiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NUESTRO EQUIPO */}
      <section className="section section-pad">
        <MediaBlock
          title="Nuestro Equipo"
          bullets={[
            "Más de 20 años de experiencia en comunidades críticas.",
            "Apoyo con tecnología de clase mundial.",
            "Vínculos y confianza con la comunidad y tu compañía.",
          ]}
          image={{ src: "/NOSOTROS.jpg", alt: "Nuestro equipo" }}
        />
      </section>

      {/* PLATAFORMA DIGITAL COMUNITARIA */}
      <section className="section section-pad">
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
      </section>

      {/* Módulo EcoConnect */}
      <section className="section section-pad">
        <MediaBlock
          title="Módulo EcoConnect"
          bullets={[
            "Conectividad y acceso a servicios básicos.",
            "Infraestructura operada con participación local.",
          ]}
          image={{ src: "/MODULO.jpg", alt: "Módulo EcoConnect" }}
        />
      </section>

      {/* Comunidad y Compañía Unidas */}
      <section className="section section-pad">
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
      </section>

      
    </main>
  );
}
