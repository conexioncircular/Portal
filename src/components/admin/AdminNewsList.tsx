"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenSquare, Search, Trash2 } from "lucide-react";
import type { AdminNewsListItem } from "@/lib/admin-news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminNewsListProps = {
  items: AdminNewsListItem[];
};

type SortOption =
  | "updated-desc"
  | "created-desc"
  | "created-asc"
  | "title-asc";

function formatDateTime(value: Date | string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function toTimestamp(value: Date | string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  const time = parsed.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function includesQuery(item: AdminNewsListItem, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    item.title,
    item.slug,
    ...item.communities.flatMap((community) => [
      community.name,
      community.slug,
    ]),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getCommunityPresentation(item: AdminNewsListItem): {
  label: string;
  detail: string;
  title: string;
} {
  const names = item.communities.map((community) => community.name);
  if (names.length <= 1) {
    return {
      label: names[0] ?? item.communityName,
      detail: item.communitySlug,
      title: names[0] ?? item.communityName,
    };
  }

  const visibleNames = names.slice(0, 3);
  const hiddenCount = names.length - visibleNames.length;
  return {
    label: `${names.length} comunidades`,
    detail: `${visibleNames.join(", ")}${
      hiddenCount > 0 ? ` y ${hiddenCount} más` : ""
    }`,
    title: names.join(", "),
  };
}

export default function AdminNewsList({ items }: AdminNewsListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [communityId, setCommunityId] = useState("__all__");
  const [visibility, setVisibility] = useState("__all__");
  const [featured, setFeatured] = useState("__all__");
  const [sortBy, setSortBy] = useState<SortOption>("updated-desc");
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const communities = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const item of items) {
      for (const community of item.communities) {
        if (!map.has(community.communityId)) {
          map.set(community.communityId, {
            id: community.communityId,
            label: community.name,
          });
        }
      }
    }

    return Array.from(map.values()).sort((left, right) =>
      left.label.localeCompare(right.label, "es")
    );
  }, [items]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    const nextItems = items.filter((item) => {
      if (!includesQuery(item, normalizedQuery)) {
        return false;
      }

      if (
        communityId !== "__all__" &&
        !item.communityIds.includes(communityId)
      ) {
        return false;
      }

      if (visibility === "publicas" && !item.isPublic) {
        return false;
      }
      if (visibility === "privadas" && item.isPublic) {
        return false;
      }

      if (featured === "destacadas" && !item.isFeatured) {
        return false;
      }
      if (featured === "normales" && item.isFeatured) {
        return false;
      }

      return true;
    });

    return [...nextItems].sort((left, right) => {
      if (sortBy === "updated-desc") {
        return (
          toTimestamp(right.updatedAt ?? right.createdAt) -
            toTimestamp(left.updatedAt ?? left.createdAt) ||
          toTimestamp(right.createdAt) - toTimestamp(left.createdAt) ||
          right.newsId.localeCompare(left.newsId, "es")
        );
      }

      if (sortBy === "created-desc") {
        return (
          toTimestamp(right.createdAt) - toTimestamp(left.createdAt) ||
          toTimestamp(right.updatedAt ?? right.createdAt) -
            toTimestamp(left.updatedAt ?? left.createdAt) ||
          right.newsId.localeCompare(left.newsId, "es")
        );
      }

      if (sortBy === "created-asc") {
        return (
          toTimestamp(left.createdAt) - toTimestamp(right.createdAt) ||
          toTimestamp(left.updatedAt ?? left.createdAt) -
            toTimestamp(right.updatedAt ?? right.createdAt) ||
          left.newsId.localeCompare(right.newsId, "es")
        );
      }

      return left.title.localeCompare(right.title, "es");
    });
  }, [items, normalizedQuery, communityId, visibility, featured, sortBy]);

  const hasFilters =
    !!query.trim() ||
    communityId !== "__all__" ||
    visibility !== "__all__" ||
    featured !== "__all__" ||
    sortBy !== "updated-desc";

  function resetFilters() {
    setQuery("");
    setCommunityId("__all__");
    setVisibility("__all__");
    setFeatured("__all__");
    setSortBy("updated-desc");
  }

  async function deleteNews(item: AdminNewsListItem) {
    if (!window.confirm(`¿Eliminar definitivamente la noticia "${item.title}"?`)) {
      return;
    }

    setDeletingNewsId(item.newsId);
    setDeleteError("");
    try {
      const response = await fetch(`/api/admin/news/${item.newsId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar la noticia");
      }
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "No se pudo eliminar la noticia"
      );
    } finally {
      setDeletingNewsId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        Todavia no hay noticias creadas.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="newsQuery">
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="newsQuery"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Título, slug o comunidad"
                className="h-12 rounded-2xl border-slate-200 bg-white pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="newsCommunity">
              Comunidad
            </label>
            <select
              id="newsCommunity"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={communityId}
              onChange={(event) => setCommunityId(event.target.value)}
            >
              <option value="__all__">Todas</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="newsVisibility">
              Publicación
            </label>
            <select
              id="newsVisibility"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
            >
              <option value="__all__">Todas</option>
              <option value="publicas">Públicas</option>
              <option value="privadas">No públicas</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="newsFeatured">
              Destacada
            </label>
            <select
              id="newsFeatured"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={featured}
              onChange={(event) => setFeatured(event.target.value)}
            >
              <option value="__all__">Todas</option>
              <option value="destacadas">Destacadas</option>
              <option value="normales">No destacadas</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="newsSort">
              Ordenar por
            </label>
            <select
              id="newsSort"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
            >
              <option value="updated-desc">Edición más reciente</option>
              <option value="created-desc">Carga más reciente</option>
              <option value="created-asc">Carga más antigua</option>
              <option value="title-asc">Título A-Z</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {filteredItems.length} de {items.length} noticias.
          </span>

          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-slate-200 bg-white"
              onClick={resetFilters}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </div>

      {deleteError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {deleteError}
        </p>
      ) : null}

      {filteredItems.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          No hay noticias que coincidan con los filtros actuales.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Comunidad</th>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Pública</th>
                <th className="px-4 py-3 font-medium">Destacada</th>
                <th className="px-4 py-3 font-medium">Fecha de carga</th>
                <th className="px-4 py-3 font-medium">Fecha de edición</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredItems.map((item) => {
                const communityPresentation = getCommunityPresentation(item);

                return (
                <tr key={item.newsId} className="align-top">
                  <td
                    className="px-4 py-4"
                    title={communityPresentation.title}
                  >
                    <div className="font-medium text-slate-900">
                      {communityPresentation.label}
                    </div>
                    <div className="max-w-xs text-xs text-slate-500">
                      {communityPresentation.detail}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-4 text-slate-600">{item.slug}</td>
                  <td className="px-4 py-4">{item.isPublic ? "Si" : "No"}</td>
                  <td className="px-4 py-4">{item.isFeatured ? "Si" : "No"}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(item.updatedAt ?? item.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200"
                    >
                      <Link href={`/admin/noticias/${item.newsId}`}>
                        <PenSquare className="h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      disabled={deletingNewsId === item.newsId}
                      onClick={() => void deleteNews(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingNewsId === item.newsId ? "Eliminando..." : "Eliminar"}
                    </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
