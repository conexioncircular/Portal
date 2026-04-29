"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  KeyRound,
  Newspaper,
  Search,
  Shield,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminPage = {
  pageId: string;
  title: string;
  path: string;
  isPublic: boolean;
};

type AdminUserAccess = {
  pageId: string;
  title: string;
  path: string;
  isPrimary: boolean;
};

type AdminUser = {
  userId: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  isAdmin: boolean;
  accesses: AdminUserAccess[];
  primaryPageId: string | null;
};

type CreateFormState = {
  email: string;
  displayName: string;
  password: string;
  isAdmin: boolean;
  primaryPageId: string;
  secondaryPageIds: string[];
};

type AccessFormState = {
  userId: string;
  isAdmin: boolean;
  primaryPageId: string;
  secondaryPageIds: string[];
};

type ProfileFormState = {
  userId: string;
  displayName: string;
  isActive: boolean;
};

type NoticeState = {
  tone: "success" | "error";
  message: string;
} | null;

type ConsoleSection = "overview" | "create" | "users" | "password" | "profile" | "access";

type PagePickerProps = {
  pages: AdminPage[];
  primaryPageId: string;
  secondaryPageIds: string[];
  pageQuery: string;
  selectedRegion: string;
  onPrimaryChange: (pageId: string) => void;
  onSecondaryToggle: (pageId: string) => void;
  onQueryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  initialLabel: string;
  secondaryLabel: string;
  secondaryHelp: string;
};

const CREATE_FORM_INITIAL: CreateFormState = {
  email: "",
  displayName: "",
  password: "",
  isAdmin: false,
  primaryPageId: "",
  secondaryPageIds: [],
};

const ACCESS_FORM_INITIAL: AccessFormState = {
  userId: "",
  isAdmin: false,
  primaryPageId: "",
  secondaryPageIds: [],
};

const PROFILE_FORM_INITIAL: ProfileFormState = {
  userId: "",
  displayName: "",
  isActive: true,
};

const ALL_REGIONS = "__all_regions__";

const REGION_RULES: Array<{ region: string; patterns: string[] }> = [
  {
    region: "Región de Atacama",
    patterns: ["incadeoro", "nantoco", "losloros", "elmolle"],
  },
  {
    region: "Región de Coquimbo",
    patterns: [
      "canela",
      "punitaqui",
      "caimanes",
      "tilama",
      "choapa",
      "coyuntagua",
      "aguada",
      "cuzcuz",
      "tunga",
      "camarones",
      "mishqui",
      "crianceros",
    ],
  },
  {
    region: "Región Metropolitana",
    patterns: [
      "loaguirre",
      "noviciado",
      "polpaico",
      "quillaicillo",
      "almendral",
      "divisadero",
      "praderas",
      "lomas",
    ],
  },
  {
    region: "Región de Antofagasta",
    patterns: ["mariaelena"],
  },
  {
    region: "Región de Valparaíso",
    patterns: ["valparaiso"],
  },
];

function isErrorResponse(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function sortUsers(users: AdminUser[]): AdminUser[] {
  return [...users].sort((left, right) => left.email.localeCompare(right.email, "es"));
}

function mergeAccessPayload(primaryPageId: string, secondaryPageIds: string[]): {
  pageIds: string[];
  primaryPageId: string | null;
} {
  const uniqueSecondary = Array.from(
    new Set(secondaryPageIds.filter((pageId) => pageId && pageId !== primaryPageId))
  );
  const pageIds = primaryPageId ? [primaryPageId, ...uniqueSecondary] : uniqueSecondary;

  return {
    pageIds,
    primaryPageId: primaryPageId || null,
  };
}

function buildAccessForm(user: AdminUser | undefined): AccessFormState {
  if (!user) {
    return ACCESS_FORM_INITIAL;
  }

  const primaryPageId = user.primaryPageId ?? "";
  const secondaryPageIds = user.accesses
    .filter((access) => access.pageId !== primaryPageId)
    .map((access) => access.pageId);

  return {
    userId: user.userId,
    isAdmin: user.isAdmin,
    primaryPageId,
    secondaryPageIds,
  };
}

function buildProfileForm(user: AdminUser | undefined): ProfileFormState {
  if (!user) {
    return PROFILE_FORM_INITIAL;
  }

  return {
    userId: user.userId,
    displayName: user.displayName ?? "",
    isActive: user.isActive,
  };
}

function inferRegion(page: AdminPage): string {
  const haystack = `${page.title} ${page.path}`.toLowerCase();
  const matchedRule = REGION_RULES.find((rule) =>
    rule.patterns.some((pattern) => haystack.includes(pattern))
  );

  return matchedRule?.region ?? "Sin región asignada";
}

function filterPages(pages: AdminPage[], query: string): AdminPage[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return pages;
  }

  return pages.filter((page) => {
    const haystack = `${page.title} ${page.path}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function getRegionOptions(pages: AdminPage[]): string[] {
  return Array.from(new Set(pages.map((page) => inferRegion(page)))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

function filterUsers(users: AdminUser[], query: string): AdminUser[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return users;
  }

  return users.filter((user) => {
    const haystack = `${user.email} ${user.displayName ?? ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function findPageTitle(pages: AdminPage[], pageId: string): string {
  return pages.find((page) => page.pageId === pageId)?.title ?? "Sin página inicial";
}

function PagePicker({
  pages,
  primaryPageId,
  secondaryPageIds,
  pageQuery,
  selectedRegion,
  onPrimaryChange,
  onSecondaryToggle,
  onQueryChange,
  onRegionChange,
  initialLabel,
  secondaryLabel,
  secondaryHelp,
}: PagePickerProps) {
  const regionOptions = getRegionOptions(pages);
  const regionFilteredPages =
    selectedRegion === ALL_REGIONS
      ? pages
      : pages.filter((page) => inferRegion(page) === selectedRegion);
  const filteredPages = filterPages(regionFilteredPages, pageQuery);
  const filteredSecondaryPages = filteredPages.filter((page) => page.pageId !== primaryPageId);

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] p-5">
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
        <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              {initialLabel}
            </p>
          </div>

          <select
            aria-label={initialLabel}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800"
            value={primaryPageId}
            onChange={(event) => onPrimaryChange(event.target.value)}
          >
            <option value="">Sin página inicial</option>
            {pages.map((page) => (
              <option key={page.pageId} value={page.pageId}>
                {page.title}
              </option>
            ))}
          </select>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Seleccionada:</span>{" "}
            {primaryPageId ? findPageTitle(pages, primaryPageId) : "Ninguna"}
          </div>
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                {secondaryLabel}
              </p>
              {secondaryHelp ? <p className="mt-2 text-sm text-slate-600">{secondaryHelp}</p> : null}
            </div>

            <div className="grid w-full gap-3 md:max-w-xl md:grid-cols-[0.52fr_0.48fr]">
              <select
                aria-label="Seleccionar región"
                className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800"
                value={selectedRegion}
                onChange={(event) => onRegionChange(event.target.value)}
              >
                <option value={ALL_REGIONS}>Todas las regiones</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={pageQuery}
                  onChange={(event) => onQueryChange(event.target.value)}
                  className="h-11 rounded-full border-slate-200 bg-slate-50 pl-10"
                  placeholder="Buscar comunidad..."
                  aria-label="Buscar página"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Región seleccionada: <span className="font-semibold text-slate-900">{selectedRegion === ALL_REGIONS ? "Todas" : selectedRegion}</span>
          </div>

          <div className="grid max-h-[26rem] gap-3 overflow-auto pr-1 md:grid-cols-2">
            {filteredSecondaryPages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                No hay páginas que coincidan con la búsqueda.
              </div>
            ) : (
              filteredSecondaryPages.map((page) => {
                const checked = secondaryPageIds.includes(page.pageId);

                return (
                  <label
                    key={page.pageId}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-emerald-300 bg-emerald-50/70 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      checked={checked}
                      onChange={() => onSecondaryToggle(page.pageId)}
                    />

                    <span className="min-w-0">
                      <span className="block font-medium">{page.title}</span>
                      <span className="block truncate text-xs text-slate-500">{page.path}</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminConsole() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [activeSection, setActiveSection] = useState<ConsoleSection>("overview");
  const [createForm, setCreateForm] = useState<CreateFormState>(CREATE_FORM_INITIAL);
  const [accessForm, setAccessForm] = useState<AccessFormState>(ACCESS_FORM_INITIAL);
  const [passwordUserId, setPasswordUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileFormState>(PROFILE_FORM_INITIAL);
  const [userSearch, setUserSearch] = useState("");
  const [createPageSearch, setCreatePageSearch] = useState("");
  const [accessPageSearch, setAccessPageSearch] = useState("");
  const [createRegion, setCreateRegion] = useState(ALL_REGIONS);
  const [accessRegion, setAccessRegion] = useState(ALL_REGIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);

  const filteredUsers = filterUsers(users, userSearch);
  const selectedAccessUser = users.find((user) => user.userId === accessForm.userId);
  const menuItems: Array<{
    id: ConsoleSection;
    label: string;
    icon: typeof UserRound;
  }> = [
    { id: "overview", label: "Resumen", icon: Sparkles },
    { id: "create", label: "Crear usuario", icon: UserRound },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "password", label: "Contraseña", icon: KeyRound },
    { id: "profile", label: "Modificar usuario", icon: UserRound },
    { id: "access", label: "Accesos", icon: Shield },
  ];

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function fetchData() {
    const [pagesRes, usersRes] = await Promise.all([
      fetch("/api/admin/pages", { cache: "no-store" }),
      fetch("/api/admin/users", { cache: "no-store" }),
    ]);

    const pagesData: unknown = await pagesRes.json();
    const usersData: unknown = await usersRes.json();

    if (!pagesRes.ok) {
      throw new Error(
        isErrorResponse(pagesData) ? pagesData.error : "No se pudieron cargar las páginas"
      );
    }

    if (!usersRes.ok) {
      throw new Error(
        isErrorResponse(usersData) ? usersData.error : "No se pudieron cargar los usuarios"
      );
    }

    const nextPages = Array.isArray((pagesData as { pages?: unknown[] }).pages)
      ? ((pagesData as { pages: AdminPage[] }).pages ?? [])
      : [];
    const nextUsers = Array.isArray((usersData as { users?: unknown[] }).users)
      ? sortUsers(((usersData as { users: AdminUser[] }).users ?? []))
      : [];

    setPages(nextPages);
    setUsers(nextUsers);
    setPasswordUserId((currentUserId) => {
      if (currentUserId && nextUsers.some((user) => user.userId === currentUserId)) {
        return currentUserId;
      }
      return nextUsers[0]?.userId ?? "";
    });
    setAccessForm((currentForm) => {
      const selectedUser = nextUsers.find((user) => user.userId === currentForm.userId) ?? nextUsers[0];
      return buildAccessForm(selectedUser);
    });
    setProfileForm((currentForm) => {
      const selectedUser = nextUsers.find((user) => user.userId === currentForm.userId) ?? nextUsers[0];
      return buildProfileForm(selectedUser);
    });
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await fetchData();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "No se pudo cargar la consola admin"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshData(message?: string) {
    setRefreshing(true);
    setErrorMessage("");

    try {
      await fetchData();
      if (message) {
        setSuccessMessage(message);
        setNotice({ tone: "success", message });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo refrescar la consola";
      setErrorMessage(message);
      setNotice({ tone: "error", message });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const accessPayload = mergeAccessPayload(
      createForm.primaryPageId,
      createForm.secondaryPageIds
    );

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email,
          displayName: createForm.displayName,
          password: createForm.password,
          isAdmin: createForm.isAdmin,
          pageIds: accessPayload.pageIds,
          primaryPageId: accessPayload.primaryPageId,
        }),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isErrorResponse(payload) ? payload.error : "No se pudo crear el usuario"
        );
      }

      setCreateForm(CREATE_FORM_INITIAL);
      setCreatePageSearch("");
      await refreshData("Usuario creado correctamente");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el usuario";
      setErrorMessage(message);
      setNotice({ tone: "error", message });
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordUserId) {
      setErrorMessage("Selecciona un usuario para actualizar la contraseña");
      return;
    }

    setPasswordSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/users/${passwordUserId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isErrorResponse(payload)
            ? payload.error
            : "No se pudo actualizar la contraseña"
        );
      }

      setNewPassword("");
      setSuccessMessage("Contraseña actualizada correctamente");
      setNotice({ tone: "success", message: "Contraseña actualizada correctamente" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la contraseña";
      setErrorMessage(message);
      setNotice({ tone: "error", message });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileForm.userId) {
      setErrorMessage("Selecciona un usuario para editar perfil");
      return;
    }

    setProfileSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/users/${profileForm.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profileForm.displayName,
          isActive: profileForm.isActive,
        }),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isErrorResponse(payload)
            ? payload.error
            : "No se pudo actualizar el perfil del usuario"
        );
      }

      await refreshData("Perfil de usuario actualizado correctamente");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el perfil del usuario";
      setErrorMessage(message);
      setNotice({ tone: "error", message });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleUpdateAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessForm.userId) {
      setErrorMessage("Selecciona un usuario para editar accesos");
      return;
    }

    setAccessSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const accessPayload = mergeAccessPayload(
      accessForm.primaryPageId,
      accessForm.secondaryPageIds
    );

    try {
      const response = await fetch(`/api/admin/users/${accessForm.userId}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageIds: accessPayload.pageIds,
          primaryPageId: accessPayload.primaryPageId,
          isAdmin: accessForm.isAdmin,
        }),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isErrorResponse(payload)
            ? payload.error
            : "No se pudieron actualizar los accesos"
        );
      }

      await refreshData("Accesos actualizados correctamente");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron actualizar los accesos";
      setErrorMessage(message);
      setNotice({ tone: "error", message });
    } finally {
      setAccessSaving(false);
    }
  }

  function openSection(section: ConsoleSection) {
    setActiveSection(section);
  }

  function openUserProfile(user: AdminUser) {
    setProfileForm(buildProfileForm(user));
    setActiveSection("profile");
  }

  function openUserAccess(user: AdminUser) {
    setAccessForm(buildAccessForm(user));
    setActiveSection("access");
  }

  function openUserPassword(user: AdminUser) {
    setPasswordUserId(user.userId);
    setActiveSection("password");
  }

  return (
    <div className="space-y-8">
      {notice && (
        <div className="fixed right-5 top-20 z-[80] w-[min(24rem,calc(100vw-2rem))]">
          <div className={`rounded-[1.5rem] border px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur ${notice.tone === "success" ? "border-emerald-200 bg-white/95 text-emerald-700" : "border-red-200 bg-white/95 text-red-700"}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${notice.tone === "success" ? "bg-emerald-100" : "bg-red-100"}`}>
                {notice.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{notice.tone === "success" ? "Cambio guardado" : "No se pudo guardar"}</p>
                <p className="mt-1 text-sm text-slate-600">{notice.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f3fbff_36%,#eef3f7_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              <Sparkles className="h-4 w-4" />
              Admin interno
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 lg:text-4xl">
              Gestión de usuarios y accesos
            </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-500">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Usuarios</span>
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{users.length}</div>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-500">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Admins</span>
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {users.filter((user) => user.isAdmin).length}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Páginas</span>
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{pages.length}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/70 bg-white/70 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white">
              <Link href="/admin/noticias">
                <Newspaper className="h-4 w-4" />
                Noticias
              </Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-full border-slate-200 bg-white"
            onClick={() => void refreshData()}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refrescando..." : "Refrescar datos"}
          </Button>
        </div>

        {(errorMessage || successMessage) && (
          <div className="space-y-3 border-t border-slate-200 px-6 py-4 lg:px-8">
            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[5.5rem_minmax(0,1fr)] xl:items-start">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.06)] xl:sticky xl:top-24">
          <nav className="flex gap-3 overflow-x-auto xl:flex-col">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => openSection(item.id)}
                  className={`flex h-12 min-w-12 items-center justify-center rounded-[1.2rem] border transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          {activeSection === "overview" && (
            <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Resumen</h2>
                  <p className="mt-1 text-sm text-slate-600">Accesos rápidos para administrar el portal.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  onClick={() => openSection("create")}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-slate-950">Crear usuario</p>
                  <p className="mt-2 text-sm text-slate-600">Alta de cuentas y página inicial.</p>
                </button>
                <button
                  type="button"
                  onClick={() => openSection("users")}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-slate-950">Usuarios</p>
                  <p className="mt-2 text-sm text-slate-600">Búsqueda y salto directo a edición.</p>
                </button>
                <button
                  type="button"
                  onClick={() => openSection("access")}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-slate-950">Accesos</p>
                  <p className="mt-2 text-sm text-slate-600">Permisos, página inicial y secundarias.</p>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Activos</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {users.filter((user) => user.isActive).length}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Inactivos</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {users.filter((user) => !user.isActive).length}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Con acceso asignado</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {users.filter((user) => user.accesses.length > 0).length}
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeSection === "create" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Crear usuario</h2>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleCreateUser}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="create-email">
                      Usuario o correo
                    </label>
                    <Input
                      id="create-email"
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                      placeholder="usuario o correo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="create-display-name">
                      Nombre visible
                    </label>
                    <Input
                      id="create-display-name"
                      value={createForm.displayName}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, displayName: event.target.value }))
                      }
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                      placeholder="Nombre completo"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="create-password">
                      Contraseña
                    </label>
                    <Input
                      id="create-password"
                      type="password"
                      value={createForm.password}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={createForm.isAdmin}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, isAdmin: event.target.checked }))
                      }
                    />
                    Hacer admin
                  </label>
                </div>

                <PagePicker
                  pages={pages}
                  primaryPageId={createForm.primaryPageId}
                  secondaryPageIds={createForm.secondaryPageIds}
                  pageQuery={createPageSearch}
                  onPrimaryChange={(pageId) =>
                    setCreateForm((current) => ({
                      ...current,
                      primaryPageId: pageId,
                      secondaryPageIds: current.secondaryPageIds.filter(
                        (secondaryId) => secondaryId !== pageId
                      ),
                    }))
                  }
                  onSecondaryToggle={(pageId) =>
                    setCreateForm((current) => ({
                      ...current,
                      secondaryPageIds: current.secondaryPageIds.includes(pageId)
                        ? current.secondaryPageIds.filter((secondaryId) => secondaryId !== pageId)
                        : [...current.secondaryPageIds, pageId],
                    }))
                  }
                  onQueryChange={setCreatePageSearch}
                  selectedRegion={createRegion}
                  onRegionChange={setCreateRegion}
                  initialLabel="Página inicial"
                  secondaryLabel="Páginas secundarias"
                  secondaryHelp=""
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="rounded-full bg-slate-950 px-6 hover:bg-slate-800"
                    disabled={createSaving || loading}
                  >
                    {createSaving ? "Creando..." : "Crear usuario"}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {activeSection === "users" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Usuarios actuales</h2>
                </div>
              </div>

              <div className="relative mb-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  className="h-12 rounded-full border-slate-200 bg-slate-50 pl-10"
                  placeholder="Buscar usuario por nombre o correo..."
                  aria-label="Buscar usuario"
                />
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    Cargando usuarios...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    No hay usuarios que coincidan con la búsqueda.
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <article
                      key={user.userId}
                      className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 transition hover:border-slate-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                          {getInitials(user.displayName ?? user.email)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {user.displayName || user.email}
                            </h3>
                            {user.isAdmin && (
                              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                                Admin
                              </span>
                            )}
                          </div>

                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Inicial: {user.primaryPageId ? findPageTitle(pages, user.primaryPageId) : "Sin definir"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Secundarias: {Math.max(user.accesses.length - (user.primaryPageId ? 1 : 0), 0)}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-slate-200 bg-white"
                              onClick={() => openUserProfile(user)}
                            >
                              Modificar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-slate-200 bg-white"
                              onClick={() => openUserAccess(user)}
                            >
                              Accesos
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-slate-200 bg-white"
                              onClick={() => openUserPassword(user)}
                            >
                              Contraseña
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {activeSection === "password" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Actualizar contraseña</h2>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleUpdatePassword}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="password-user">
                    Usuario
                  </label>
                  <select
                    id="password-user"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800"
                    value={passwordUserId}
                    onChange={(event) => setPasswordUserId(event.target.value)}
                  >
                    <option value="">Selecciona un usuario</option>
                    {filteredUsers.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="new-password">
                    Nueva contraseña
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="rounded-full bg-slate-950 px-6 hover:bg-slate-800"
                    disabled={passwordSaving || loading}
                  >
                    {passwordSaving ? "Actualizando..." : "Actualizar contraseña"}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {activeSection === "profile" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Editar nombre y estado</h2>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleUpdateProfile}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="profile-user">
                    Usuario
                  </label>
                  <select
                    id="profile-user"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800"
                    value={profileForm.userId}
                    onChange={(event) => {
                      const selectedUser = users.find((user) => user.userId === event.target.value);
                      setProfileForm(buildProfileForm(selectedUser));
                    }}
                  >
                    <option value="">Selecciona un usuario</option>
                    {filteredUsers.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="profile-display-name">
                    Nombre visible
                  </label>
                  <Input
                    id="profile-display-name"
                    value={profileForm.displayName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Nombre visible del usuario"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={profileForm.isActive}
                    onChange={(event) => setProfileForm((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  Usuario activo
                </label>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="rounded-full bg-slate-950 px-6 hover:bg-slate-800"
                    disabled={profileSaving || loading || !profileForm.userId}
                  >
                    {profileSaving ? "Guardando..." : "Guardar perfil"}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {activeSection === "access" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Asignar o quitar acceso a páginas</h2>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleUpdateAccess}>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="access-user">
                      Usuario
                    </label>
                    <select
                      id="access-user"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800"
                      value={accessForm.userId}
                      onChange={(event) => {
                        const selectedUser = users.find((user) => user.userId === event.target.value);
                        setAccessForm(buildAccessForm(selectedUser));
                      }}
                    >
                      <option value="">Selecciona un usuario</option>
                      {filteredUsers.map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={accessForm.isAdmin}
                      onChange={(event) =>
                        setAccessForm((current) => ({ ...current, isAdmin: event.target.checked }))
                      }
                    />
                    Usuario admin
                  </label>
                </div>

                {selectedAccessUser && (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_100%)] p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                        {getInitials(selectedAccessUser.displayName ?? selectedAccessUser.email)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {selectedAccessUser.displayName || selectedAccessUser.email}
                        </p>
                        <p className="text-xs text-slate-500">{selectedAccessUser.email}</p>
                      </div>
                      {selectedAccessUser.isAdmin && (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          Admin actual
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <PagePicker
                  pages={pages}
                  primaryPageId={accessForm.primaryPageId}
                  secondaryPageIds={accessForm.secondaryPageIds}
                  pageQuery={accessPageSearch}
                  onPrimaryChange={(pageId) =>
                    setAccessForm((current) => ({
                      ...current,
                      primaryPageId: pageId,
                      secondaryPageIds: current.secondaryPageIds.filter(
                        (secondaryId) => secondaryId !== pageId
                      ),
                    }))
                  }
                  onSecondaryToggle={(pageId) =>
                    setAccessForm((current) => ({
                      ...current,
                      secondaryPageIds: current.secondaryPageIds.includes(pageId)
                        ? current.secondaryPageIds.filter((secondaryId) => secondaryId !== pageId)
                        : [...current.secondaryPageIds, pageId],
                    }))
                  }
                  onQueryChange={setAccessPageSearch}
                  selectedRegion={accessRegion}
                  onRegionChange={setAccessRegion}
                  initialLabel="Página inicial del usuario"
                  secondaryLabel="Páginas secundarias del usuario"
                  secondaryHelp=""
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="rounded-full bg-slate-950 px-6 hover:bg-slate-800"
                    disabled={accessSaving || loading || !accessForm.userId}
                  >
                    {accessSaving ? "Guardando..." : "Guardar accesos"}
                  </Button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}