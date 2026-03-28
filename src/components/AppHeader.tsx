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

type CommunityRow = {
  Title: string;
  Path: string;
  LogoUrl?: string | null;
};

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

const BRAND_DARK = "#1E1A1D";
const BRAND_BLUE_SOFT = "#EAF8FD";

const PUBLIC_ROUTES = ["/", "/politica-de-seguridad","/Oficina-movil"];

const HIDE_HEADER_ROUTES = ["/login"];

const PUBLIC_NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Comunidades", href: "/comunidades" },
  { label: "Oficina Móvil", href: "/Oficina-movil" },
  { label: "Política de seguridad", href: "/politica-de-seguridad" },
];

const PUBLIC_LOGO = "/LOGO-2.png";
const PRIVATE_LOGO = "/conexion-energia.png";

export default function AppHeader({
  logoSrc,
  logoAlt = "Conexión",
  user,
  showSearch = false,
}: AppHeaderProps) {
  const { data: session } = useSession();
  const effectiveUser: AppUser | null = user ?? (session?.user as AppUser) ?? null;

  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const pathname = usePathname() || "/";
  const router = useRouter();

  const hideHeader = HIDE_HEADER_ROUTES.includes(pathname);
 const isPublicRoute =
  PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/servicios/");

  const effectiveLogoSrc = logoSrc ?? (isPublicRoute ? PUBLIC_LOGO : PRIVATE_LOGO);

  useEffect(() => {
    if (isPublicRoute || hideHeader) return;

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
      } catch (error) {
        console.error("Error al cargar comunidades:", error);
        if (!mounted) return;
        setCommunities([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isPublicRoute, hideHeader]);

  const activeCommunity = useMemo(() => {
    const cur = pathname.toLowerCase();
    return communities.find((c) => (c.Path || "").toLowerCase() === cur) ?? null;
  }, [communities, pathname]);

  const initials = (txt?: string | null) =>
    (txt?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "U").toUpperCase();

  const handleCommunityClick = (community: CommunityRow) => {
    const path = community.Path?.startsWith("/") ? community.Path : `/${community.Path ?? ""}`;
    if (path) router.push(path);
  };

  if (hideHeader) return null;

  if (isPublicRoute) {
    return <PublicHeader logoSrc={effectiveLogoSrc} logoAlt={logoAlt} pathname={pathname} />;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/92 backdrop-blur supports-[backdrop-filter]:bg-white/82">
      <div className="mx-auto flex h-24 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center sm:hidden">
          <MobileNav
            logoSrc={effectiveLogoSrc}
            logoAlt={logoAlt}
            communities={communities}
            onSelect={handleCommunityClick}
            user={effectiveUser}
          />
        </div>

        <Link href="/post-login" className="flex items-center">
          <Image
            src={effectiveLogoSrc}
            alt={logoAlt}
            width={260}
            height={72}
            priority
            className="h-auto w-[170px] object-contain sm:w-[210px] lg:w-[235px]"
          />
        </Link>

        {communities.length > 0 && (
          <div className="ml-2 hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 rounded-full px-4">
                  <Home className="h-4 w-4" />
                  <span className="max-w-[240px] truncate">
                    {activeCommunity ? activeCommunity.Title : "Selecciona tu comunidad"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Comunidades</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {communities.map((community) => (
                  <DropdownMenuItem
                    key={community.Path}
                    onClick={() => handleCommunityClick(community)}
                    className="flex items-center gap-2"
                  >
                    {community.LogoUrl ? (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={community.LogoUrl} alt={community.Title} />
                        <AvatarFallback>{initials(community.Title)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{initials(community.Title)}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className="min-w-0">
                      <div className="truncate font-medium">{community.Title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {community.Path}
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <Input placeholder="Buscar..." className="w-56 rounded-full pl-9" />
            </div>
          )}

          <Button variant="ghost" size="icon" aria-label="Notificaciones" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 rounded-full px-2">
                <Avatar className="h-8 w-8">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
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
  const isHome = pathname === "/";
  const isSecurity = pathname === "/politica-de-seguridad";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/96 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-28 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={300}
            height={84}
            priority
            className="h-auto w-[190px] object-contain sm:w-[230px] lg:w-[270px]"
          />
        </Link>

        <div className="hidden flex-1 justify-center lg:flex">
          <nav className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
  <Link
    href="/"
    className="rounded-full px-6 py-3 text-[16px] font-medium transition"
    style={
      pathname === "/"
        ? { backgroundColor: BRAND_BLUE_SOFT, color: BRAND_DARK }
        : { color: "#4b5563" }
    }
  >
    Inicio
  </Link>

  <Link
    href="/#comunidades"
    className="rounded-full px-6 py-3 text-[16px] font-medium text-[#4b5563] transition hover:bg-[#f7f7f7] hover:text-[#111827]"
  >
    Comunidades
  </Link>

  <Link
    href="/Oficina-movil"
    className="rounded-full px-6 py-3 text-[16px] font-medium transition"
    style={
      pathname === "/Oficina-movil"
        ? { backgroundColor: BRAND_BLUE_SOFT, color: BRAND_DARK }
        : { color: "#4b5563" }
    }
  >
    Oficina Móvil
  </Link>

  <Link
    href="/politica-de-seguridad"
    className="rounded-full px-6 py-3 text-[16px] font-medium transition"
    style={
      pathname === "/politica-de-seguridad"
        ? { backgroundColor: BRAND_BLUE_SOFT, color: BRAND_DARK }
        : { color: "#4b5563" }
    }
  >
    Política de seguridad
  </Link>
</nav>
        </div>

        <div className="ml-auto hidden lg:flex">
          <Link
            href="/login"
            className="rounded-full px-7 py-3 text-[16px] font-semibold text-white transition hover:opacity-92"
            style={{ backgroundColor: BRAND_DARK }}
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
        <Button variant="ghost" size="icon" aria-label="Abrir menú" className="rounded-full">
          <MenuIcon className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="px-4 pb-2 pt-4">
          <div className="flex items-center">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={180}
              height={48}
              className="h-auto w-[150px] object-contain"
            />
          </div>
          <SheetTitle className="sr-only">Menú</SheetTitle>
        </SheetHeader>

        <nav className="space-y-3 px-4 pb-6 pt-4">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Button key={item.href} asChild variant="ghost" className="w-full justify-start rounded-full">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}

          <div className="pt-2">
            <Button asChild className="w-full rounded-full" style={{ backgroundColor: BRAND_DARK }}>
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
  onSelect: (community: CommunityRow) => void;
  user?: AppUser | null;
}) {
  const initials = (txt?: string | null) =>
    (txt?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "U").toUpperCase();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2 rounded-full" aria-label="Abrir menú">
          <MenuIcon className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="px-4 pb-2 pt-4">
          <div className="flex items-center">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={180}
              height={48}
              className="h-auto w-[150px] object-contain"
            />
          </div>
          <SheetTitle className="sr-only">Menú</SheetTitle>
        </SheetHeader>

        <nav className="space-y-6 px-4 pb-6">
          <div className="space-y-1">
            <h4 className="px-1 text-xs font-semibold uppercase text-muted-foreground">
              Navegación
            </h4>
            <Button asChild variant="ghost" className="w-full justify-start rounded-full">
              <Link href="/post-login">
                <Home className="mr-2 h-4 w-4" />
                Inicio
              </Link>
            </Button>
          </div>

          {communities.length > 0 && (
            <div className="space-y-2">
              <h4 className="px-1 text-xs font-semibold uppercase text-muted-foreground">
                Comunidades
              </h4>

              <div className="max-h-56 space-y-1 overflow-auto pr-1">
                {communities.map((community) => (
                  <Button
                    key={community.Path}
                    variant="outline"
                    className="w-full justify-start rounded-full"
                    onClick={() => onSelect(community)}
                  >
                    <Avatar className="mr-2 h-6 w-6">
                      <AvatarFallback>{initials(community.Title)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{community.Title}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="px-1 text-xs font-semibold uppercase text-muted-foreground">
              Cuenta
            </h4>

            <div className="flex items-center gap-3 rounded-2xl border p-3">
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

            <Button className="w-full rounded-full" asChild>
              <Link href="/post-login">Panel principal</Link>
            </Button>

            <Button
              variant="destructive"
              className="w-full rounded-full"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}