"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Menu as MenuIcon,
  Bell,
  LogOut,
  Home,
  Search,
} from "lucide-react";

type CommunityRow = { Title: string; Path: string; LogoUrl?: string | null };

export type AppUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

interface AppHeaderProps {
  logoSrc?: string;
  logoAlt?: string;
  user?: AppUser | null;
  showSearch?: boolean;
}

const PUBLIC_ROUTES = ["/", "/politica-de-seguridad"];

const PUBLIC_NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Comunidades", href: "/#comunidades" },
  { label: "Política de seguridad", href: "/politica-de-seguridad" },
];

export default function AppHeader({
  logoSrc = "/LOGO-2.png",
  logoAlt = "Conexión Circular",
  user,
  showSearch = false,
}: AppHeaderProps) {
  const { data: session } = useSession();
  const effectiveUser: AppUser | null = user ?? (session?.user as AppUser) ?? null;

  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const pathname = usePathname() || "/";
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const effectiveLogoSrc = pathname === "/login" ? "/conexion-energia.png" : logoSrc;
  const effectiveLogoAlt = pathname === "/login" ? "Conexión Energía" : logoAlt;

  useEffect(() => {
    if (isPublicRoute) return;

    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/public/communities", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();

        if (!mounted) return;

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.communities)
          ? data.communities
          : [];

        setCommunities(rows);
      } catch (err) {
        console.error("Error al cargar comunidades:", err);
        if (!mounted) return;
        setCommunities([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isPublicRoute]);

  const activeCommunity = useMemo(() => {
    const cur = pathname.toLowerCase();
    return communities.find((c) => (c.Path || "").toLowerCase() === cur) ?? null;
  }, [communities, pathname]);

  const initials = (txt?: string | null) =>
    (txt?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "U").toUpperCase();

  const handleCommunityClick = (c: CommunityRow) => {
    const p = c.Path?.startsWith("/") ? c.Path : `/${c.Path ?? ""}`;
    if (p) router.push(p);
  };

  if (isPublicRoute) {
    return (
      <PublicHeader
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        pathname={pathname}
      />
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        <div className="flex items-center sm:hidden">
          <MobileNav
            logoSrc={effectiveLogoSrc}
            logoAlt={effectiveLogoAlt}
            communities={communities}
            onSelect={handleCommunityClick}
            user={effectiveUser}
          />
        </div>

        <Link href="/post-login" className="flex items-center gap-2">
          <Image
            src={effectiveLogoSrc}
            alt={effectiveLogoAlt}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-contain"
          />
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            {effectiveLogoAlt}
          </span>
        </Link>

        {communities.length > 0 && (
          <div className="ml-2 hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 rounded-xl">
                  <Home className="h-4 w-4" />
                  <span className="max-w-[240px] truncate">
                    {activeCommunity ? activeCommunity.Title : "Selecciona tu Comunidad"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Comunidades</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {communities.map((c) => (
                  <DropdownMenuItem
                    key={c.Path}
                    onClick={() => handleCommunityClick(c)}
                    className="flex items-center gap-2"
                  >
                    {c.LogoUrl ? (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.LogoUrl} alt={c.Title} />
                        <AvatarFallback>{initials(c.Title)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{initials(c.Title)}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.Title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.Path}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex-1" />

        <div className="hidden items-center gap-2 sm:flex">
          {showSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <Input placeholder="Buscar…" className="w-56 pl-8" />
            </div>
          )}

          <Button variant="ghost" size="icon" aria-label="Notificaciones">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  {effectiveUser?.image && (
                    <AvatarImage
                      src={effectiveUser.image}
                      alt={effectiveUser?.name ?? "Usuario"}
                    />
                  )}
                  <AvatarFallback>
                    {initials(effectiveUser?.name || effectiveUser?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[160px] truncate text-sm">
                  {effectiveUser?.name || effectiveUser?.email || "Usuario"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/post-login">Panel principal</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/perfil">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function PublicHeader({
  logoSrc,
  logoAlt,
  pathname,
}: {
  logoSrc: string;
  logoAlt: string;
  pathname: string;
}) {
  const isSecurity = pathname === "/politica-de-seguridad";
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-28 max-w-7xl items-center px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <span className="text-[2rem] font-semibold tracking-tight text-[#111827]">
            {logoAlt}
          </span>
        </Link>

        <div className="hidden flex-1 justify-center lg:flex">
          <nav className="inline-flex items-center gap-3 rounded-[24px] border border-black/10 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <Link
              href="/"
              className={`rounded-full px-6 py-3 text-lg font-medium transition ${
                isHome
                  ? "bg-[#22d3c5] text-[#111827]"
                  : "text-[#6b7280] hover:bg-[#f5f5f5] hover:text-[#111827]"
              }`}
            >
              Inicio
            </Link>

            <Link
              href="/#comunidades"
              className="rounded-full px-6 py-3 text-lg font-medium text-[#6b7280] transition hover:bg-[#f5f5f5] hover:text-[#111827]"
            >
              Comunidades
            </Link>

            <Link
              href="/politica-de-seguridad"
              className={`rounded-full px-6 py-3 text-lg font-medium transition ${
                isSecurity
                  ? "bg-[#f3f4f6] text-[#111827]"
                  : "text-[#6b7280] hover:bg-[#f5f5f5] hover:text-[#111827]"
              }`}
            >
              Política de seguridad
            </Link>
          </nav>
        </div>

        <div className="ml-auto hidden lg:flex">
          <Link
            href="/login"
            className="rounded-full bg-[#0f172a] px-8 py-4 text-lg font-semibold text-white transition hover:bg-black"
          >
            Ingresar
          </Link>
        </div>

        <div className="ml-auto lg:hidden">
          <PublicMobileNav logoSrc={logoSrc} logoAlt={logoAlt} />
        </div>
      </div>
    </header>
  );
}

function PublicMobileNav({
  logoSrc,
  logoAlt,
}: {
  logoSrc: string;
  logoAlt: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <SheetTitle className="text-base">{logoAlt}</SheetTitle>
          </div>
        </SheetHeader>

        <nav className="space-y-3 px-4 pb-6 pt-4">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Button key={item.href} asChild variant="ghost" className="w-full justify-start">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}

          <div className="pt-2">
            <Button asChild className="w-full">
              <Link href="/login">Ingresar</Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileNav({
  logoSrc,
  logoAlt,
  communities,
  onSelect,
  user,
}: {
  logoSrc: string;
  logoAlt: string;
  communities: CommunityRow[];
  onSelect: (c: CommunityRow) => void;
  user?: AppUser | null;
}) {
  const initials = (txt?: string | null) =>
    (txt?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "U").toUpperCase();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2">
          <MenuIcon className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-contain"
            />
            <SheetTitle className="text-base">{logoAlt}</SheetTitle>
          </div>
        </SheetHeader>

        <nav className="space-y-6 px-4 pb-6">
          <div className="space-y-1">
            <h4 className="px-1 text-xs font-semibold uppercase text-muted-foreground">
              Navegación
            </h4>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/post-login">
                <Home className="mr-2 h-4 w-4" /> Inicio
              </Link>
            </Button>
          </div>

          {communities.length > 0 && (
            <div className="space-y-2">
              <h4 className="px-1 text-xs font-semibold uppercase text-muted-foreground">
                Comunidades
              </h4>
              <div className="max-h-56 space-y-1 overflow-auto pr-1">
                {communities.map((c) => (
                  <Button
                    key={c.Path}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onSelect(c)}
                  >
                    <Avatar className="mr-2 h-6 w-6">
                      <AvatarFallback>{initials(c.Title)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{c.Title}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="px-1 text-xs font-semibold uppercase text-muted-foreground">
              Cuenta
            </h4>
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <Avatar className="h-9 w-9">
                {user?.image && <AvatarImage src={user.image} alt={user?.name ?? "Usuario"} />}
                <AvatarFallback>{initials(user?.name || user?.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {user?.name || "Usuario"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user?.email || ""}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" asChild>
                <Link href="/post-login">Panel</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/perfil">Perfil</Link>
              </Button>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}