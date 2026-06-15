"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Shield,
} from "lucide-react";

type CommunityRow = {
  Title: string;
  Path: string;
  LogoUrl?: string | null;
};

export type AppUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
  roles?: string[];
};

interface AppHeaderProps {
  logoSrc?: string;
  logoAlt?: string;
  user?: AppUser | null;
  showSearch?: boolean;
}

const BRAND_DARK = "#1E1A1D";
const BRAND_BLUE_SOFT = "#EAF8FD";
const PUBLIC_ROUTES = ["/", "/comunidades", "/politica-de-seguridad", "/Oficina-movil"];
const HIDE_HEADER_ROUTES = ["/login"];
const PUBLIC_NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Comunidades", href: "/comunidades" },
  { label: "Oficina Movil", href: "/Oficina-movil" },
  { label: "Politica de seguridad", href: "/politica-de-seguridad" },
];
const PUBLIC_LOGO = "/LOGO-2.png";
const PRIVATE_LOGO = "/conexion-energia.png";
const CLIENT_NAVIGATION_FALLBACK_MS = 1500;

export default function AppHeader({
  logoSrc,
  logoAlt = "Conexion",
  user,
  showSearch = false,
}: AppHeaderProps) {
  const { data: session, status } = useSession();
  const effectiveSession = session ?? null;
  const effectiveUser: AppUser | null = user ?? (effectiveSession?.user as AppUser) ?? null;
  const isAdmin = Boolean(
    effectiveSession?.isAdmin ||
      effectiveSession?.user?.isAdmin ||
      effectiveUser?.isAdmin ||
      effectiveSession?.roles?.includes("admin") ||
      effectiveSession?.user?.roles?.includes("admin") ||
      effectiveUser?.roles?.includes("admin")
  );

  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);
  const pathname = usePathname() || "/";
  const router = useRouter();
  const navigationFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideHeader = HIDE_HEADER_ROUTES.includes(pathname);
  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/servicios/");
  const shouldLoadCommunities =
    !hideHeader && !isPublicRoute && status === "authenticated" && !!session?.user?.email;

  const effectiveLogoSrc = logoSrc ?? (isPublicRoute ? PUBLIC_LOGO : PRIVATE_LOGO);

  useEffect(() => {
    if (!shouldLoadCommunities) {
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    void (async () => {
      try {
        const res = await fetch("/api/public/communities", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!mounted) {
          return;
        }

        if (!res.ok) {
          setCommunities([]);
          return;
        }

        const data = await res.json();
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.communities)
          ? data.communities
          : [];

        setCommunities(rows);
      } catch (error) {
        if (!mounted || controller.signal.aborted) {
          return;
        }

        console.error("Error al cargar comunidades:", error);
        setCommunities([]);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [session?.user?.email, shouldLoadCommunities]);

  useEffect(() => {
    return () => {
      if (navigationFallbackRef.current) {
        clearTimeout(navigationFallbackRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (navigationFallbackRef.current) {
      clearTimeout(navigationFallbackRef.current);
      navigationFallbackRef.current = null;
    }
  }, [pathname]);

  const visibleCommunities = useMemo(
    () => (shouldLoadCommunities ? communities : []),
    [communities, shouldLoadCommunities]
  );

  const activeCommunity = useMemo(() => {
    const currentPath = pathname.toLowerCase();

    return (
      visibleCommunities.find((community) => {
        const communityPath = (community.Path || "").toLowerCase();
        return (
          communityPath &&
          (currentPath === communityPath || currentPath.startsWith(`${communityPath}/`))
        );
      }) ?? null
    );
  }, [pathname, visibleCommunities]);

  const initials = (text?: string | null) =>
    (text?.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("") || "U").toUpperCase();

  const navigateToPath = (targetPath: string) => {
    const normalizedTarget = String(targetPath ?? "").trim();
    if (!normalizedTarget) {
      return;
    }

    setCommunityMenuOpen(false);
    setAccountMenuOpen(false);

    if (navigationFallbackRef.current) {
      clearTimeout(navigationFallbackRef.current);
    }

    router.push(normalizedTarget);

    navigationFallbackRef.current = setTimeout(() => {
      if (typeof window === "undefined") {
        return;
      }

      if (window.location.pathname.toLowerCase() !== normalizedTarget.toLowerCase()) {
        window.location.assign(normalizedTarget);
      }
    }, CLIENT_NAVIGATION_FALLBACK_MS);
  };

  const handleCommunitySelect = (community: CommunityRow) => {
    const path = community.Path?.startsWith("/") ? community.Path : `/${community.Path ?? ""}`;
    if (path) {
      navigateToPath(path);
    }
  };

  const handleSignOut = () => {
    setCommunityMenuOpen(false);
    setAccountMenuOpen(false);
    setSignOutPending(true);

    void signOut({ callbackUrl: "/login" }).catch((error) => {
      console.error("Error al cerrar sesion:", error);
      setSignOutPending(false);
    });
  };

  if (hideHeader) {
    return null;
  }

  if (isPublicRoute) {
    return <PublicHeader logoSrc={effectiveLogoSrc} logoAlt={logoAlt} pathname={pathname} />;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-24 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center sm:hidden">
          <MobileNav
            logoSrc={effectiveLogoSrc}
            logoAlt={logoAlt}
            communities={visibleCommunities}
            onSelect={handleCommunitySelect}
            user={effectiveUser}
            isAdmin={isAdmin}
            onSignOut={handleSignOut}
            signOutPending={signOutPending}
          />
        </div>

        <Link href="/post-login" className="flex shrink-0 items-center">
          <Image
            src={effectiveLogoSrc}
            alt={logoAlt}
            width={260}
            height={72}
            priority
            className="h-auto w-[180px] object-contain sm:w-[220px] lg:w-[240px]"
          />
        </Link>

        {visibleCommunities.length > 0 && (
          <div className="ml-3 hidden sm:block">
            <DropdownMenu
              modal={false}
              open={communityMenuOpen}
              onOpenChange={setCommunityMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex h-12 items-center gap-3 rounded-full border border-gray-200 bg-white px-5 text-base font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                  <Home className="h-4 w-4 text-gray-600" />
                  <span className="max-w-[220px] truncate">
                    {activeCommunity ? activeCommunity.Title : "Selecciona tu comunidad"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="w-80 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg"
              >
                <DropdownMenuLabel>Comunidades</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibleCommunities.map((community) => (
                  <DropdownMenuItem
                    key={community.Path}
                    onSelect={() => handleCommunitySelect(community)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2"
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

        <div className="hidden items-center gap-3 sm:flex">
          {isAdmin && (
            <Button
              asChild
              variant="outline"
              className="rounded-full border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
            >
              <Link href="/admin">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}

          {showSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <Input placeholder="Buscar..." className="w-56 rounded-full pl-9" />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificaciones"
            className="h-10 w-10 rounded-full text-gray-700 hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu
            modal={false}
            open={accountMenuOpen}
            onOpenChange={setAccountMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 rounded-full px-2 py-1 text-gray-800 hover:bg-transparent"
              >
                <Avatar className="h-10 w-10">
                  {effectiveUser?.image && (
                    <AvatarImage
                      src={effectiveUser.image}
                      alt={effectiveUser?.name ?? "Usuario"}
                    />
                  )}
                  <AvatarFallback className="bg-gray-100 text-sm font-semibold text-gray-700">
                    {initials(effectiveUser?.name || effectiveUser?.email)}
                  </AvatarFallback>
                </Avatar>

                <span className="max-w-[160px] truncate text-base font-medium">
                  {effectiveUser?.name || effectiveUser?.email || "Usuario"}
                </span>

                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => navigateToPath("/post-login")}
                className="cursor-pointer"
              >
                Panel principal
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onSelect={() => navigateToPath("/admin")}
                  className="cursor-pointer"
                >
                  Administracion
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={signOutPending}
                onSelect={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {signOutPending ? "Cerrando sesion..." : "Cerrar sesion"}
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
              href="/comunidades"
              className="rounded-full px-6 py-3 text-[16px] font-medium transition"
              style={
                pathname === "/comunidades"
                  ? { backgroundColor: BRAND_BLUE_SOFT, color: BRAND_DARK }
                  : { color: "#4b5563" }
              }
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
              Oficina Movil
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
              Politica de seguridad
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
        <Button variant="ghost" size="icon" aria-label="Abrir menu" className="rounded-full">
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
          <SheetTitle className="sr-only">Menu</SheetTitle>
        </SheetHeader>

        <nav className="space-y-3 px-4 pb-6 pt-4">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className="w-full justify-start rounded-full"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}

          <div className="pt-2">
            <Button
              asChild
              className="w-full rounded-full"
              style={{ backgroundColor: BRAND_DARK }}
            >
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
  isAdmin,
  onSignOut,
  signOutPending,
}: {
  logoSrc: string;
  logoAlt: string;
  communities: CommunityRow[];
  onSelect: (community: CommunityRow) => void;
  user?: AppUser | null;
  isAdmin: boolean;
  onSignOut: () => void;
  signOutPending: boolean;
}) {
  const initials = (text?: string | null) =>
    (text?.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("") || "U").toUpperCase();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2 rounded-full" aria-label="Abrir menu">
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
          <SheetTitle className="sr-only">Menu</SheetTitle>
        </SheetHeader>

        <nav className="space-y-6 px-4 pb-6">
          <div className="space-y-1">
            <h4 className="px-1 text-xs font-semibold uppercase text-muted-foreground">
              Navegacion
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
                <div className="truncate text-sm font-medium">{user?.name || "Usuario"}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.email || ""}</div>
              </div>
            </div>

            <Button className="w-full rounded-full" asChild>
              <Link href="/post-login">Panel principal</Link>
            </Button>

            {isAdmin && (
              <Button variant="outline" className="w-full rounded-full" asChild>
                <Link href="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Administracion
                </Link>
              </Button>
            )}

            <Button
              variant="destructive"
              className="w-full rounded-full"
              disabled={signOutPending}
              onClick={onSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {signOutPending ? "Cerrando sesion..." : "Cerrar sesion"}
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
