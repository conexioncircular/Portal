import Link from "next/link";

type CtaItem = { label: string; href: string };
type Props = {
  backgroundImage?: string;        // ej: "/P12.jpg"
  items: CtaItem[];
  rows?: number;                   // opcional
  className?: string;
};
export default function CtaGrid({ backgroundImage, items, className = "" }: Props) {
  return (
    <section
      className={`relative`}
      style={
        backgroundImage
          ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      <div className={`mx-auto max-w-6xl px-4 py-10 md:py-14 ${className}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map((it) => {
            const isInternal = it.href.startsWith("/");
            const cls =
              "rounded-lg border bg-white/90 px-4 py-4 text-center text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-500";
            return isInternal ? (
              <Link key={it.label} href={it.href} className={cls} aria-label={it.label}>
                {it.label}
              </Link>
            ) : (
              <a key={it.label} href={it.href} className={cls} aria-label={it.label}>
                {it.label}
              </a>
            );
          })}
        </div>
      </div>
      {backgroundImage && <div aria-hidden className="absolute inset-0 -z-10 bg-black/20" />}
    </section>
  );
}
