import Image from "next/image";
import Link from "next/link";

export default function SimpleHeader({
  logoSrc,
  logoAlt = "",
  links = [
    { label: "Página principal", href: "/" },
    { label: "Oficina móvil", href: "/OficinaMovil" },
    { label: "Comunidad", href: "/Comunidad" },
  ],
}: {
  logoSrc: string;
  logoAlt?: string;
  links?: { label: string; href: string }[];
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Inicio">
          <Image src={logoSrc} alt={logoAlt} width={120} height={36} />
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-slate-700">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

