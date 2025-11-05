import Image from "next/image";

type Cta = { label: string; href: string; variant?: "primary" | "ghost" };
type HeroBannerProps = {
  title: string;
  background: string;
  ctas?: Cta[];
  logoSrc?: string;
  logoAlt?: string;
  styleButton?: React.CSSProperties;
};
export default function HeroBanner({
  title,
  background,
  ctas = [],
  logoSrc,
  logoAlt = "",
  styleButton,
}: HeroBannerProps) {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10">
        <Image src={background} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 text-white">
        {logoSrc && (
          <div className="flex justify-center mb-6">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={320}
              height={96}
              style={{ width: "auto", height: "64px" }}
              priority
            />
          </div>
        )}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-center">
          {title}
        </h1>

        {ctas.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {ctas.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className={
                  c.variant === "primary"
                    ? "rounded-lg px-4 py-2 font-bold shadow-lg transition-colors duration-200"
                    : "rounded-lg border border-white/60 bg-white/10 px-4 py-2 font-medium hover:bg-white/20"
                }
                style={c.variant === "primary" && styleButton ? styleButton : undefined}
              >
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
