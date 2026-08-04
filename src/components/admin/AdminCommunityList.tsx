"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenSquare, Search, Trash2 } from "lucide-react";
import type { AdminCommunityListItem } from "@/lib/admin-communities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminCommunityListProps = {
  items: AdminCommunityListItem[];
};

type SortOption = "name-asc" | "name-desc" | "region-asc" | "tipo-asc" | "tramo-asc";

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatValue(value: string | null | undefined): string {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
}

function parseTramo(value: string | null | undefined): number {
  const match = String(value ?? "").match(/\d+/);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function compareNullableText(left: string | null | undefined, right: string | null | undefined): number {
  const normalizedLeft = String(left ?? "").trim();
  const normalizedRight = String(right ?? "").trim();

  if (!normalizedLeft && !normalizedRight) {
    return 0;
  }
  if (!normalizedLeft) {
    return 1;
  }
  if (!normalizedRight) {
    return -1;
  }

  return normalizedLeft.localeCompare(normalizedRight, "es");
}

function includesQuery(item: AdminCommunityListItem, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = normalizeText(
    [
      item.name,
      item.slug,
      item.region,
      item.localidad,
      item.tipo,
      item.tramo,
      item.path,
    ].join(" ")
  );

  return haystack.includes(query);
}

function getUniqueOptions(
  items: AdminCommunityListItem[],
  selector: (item: AdminCommunityListItem) => string | null
): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => String(selector(item) ?? "").trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right, "es"));
}

export default function AdminCommunityList({ items }: AdminCommunityListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("__all__");
  const [region, setRegion] = useState("__all__");
  const [tipo, setTipo] = useState("__all__");
  const [tramo, setTramo] = useState("__all__");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [deletingCommunityId, setDeletingCommunityId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const deferredQuery = useDeferredValue(query);

  const regions = useMemo(() => getUniqueOptions(items, (item) => item.region), [items]);
  const tipos = useMemo(() => getUniqueOptions(items, (item) => item.tipo), [items]);
  const tramos = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => String(item.tramo ?? "").trim())
            .filter(Boolean)
        )
      ).sort(
        (left, right) =>
          parseTramo(left) - parseTramo(right) || left.localeCompare(right, "es")
      ),
    [items]
  );

  const normalizedQuery = useMemo(() => normalizeText(deferredQuery), [deferredQuery]);

  const filteredItems = useMemo(() => {
    const nextItems = items.filter((item) => {
      if (!includesQuery(item, normalizedQuery)) {
        return false;
      }

      if (status === "active" && !item.isActive) {
        return false;
      }
      if (status === "inactive" && item.isActive) {
        return false;
      }

      if (region !== "__all__" && item.region !== region) {
        return false;
      }

      if (tipo !== "__all__" && item.tipo !== tipo) {
        return false;
      }

      if (tramo !== "__all__" && item.tramo !== tramo) {
        return false;
      }

      return true;
    });

    return [...nextItems].sort((left, right) => {
      if (sortBy === "name-desc") {
        return right.name.localeCompare(left.name, "es");
      }

      if (sortBy === "region-asc") {
        return (
          compareNullableText(left.region, right.region) ||
          left.name.localeCompare(right.name, "es")
        );
      }

      if (sortBy === "tipo-asc") {
        return (
          compareNullableText(left.tipo, right.tipo) ||
          left.name.localeCompare(right.name, "es")
        );
      }

      if (sortBy === "tramo-asc") {
        return (
          parseTramo(left.tramo) - parseTramo(right.tramo) ||
          compareNullableText(left.tramo, right.tramo) ||
          left.name.localeCompare(right.name, "es")
        );
      }

      return left.name.localeCompare(right.name, "es");
    });
  }, [items, normalizedQuery, region, sortBy, status, tipo, tramo]);

  const hasFilters =
    !!query.trim() ||
    status !== "__all__" ||
    region !== "__all__" ||
    tipo !== "__all__" ||
    tramo !== "__all__" ||
    sortBy !== "name-asc";

  function resetFilters() {
    setQuery("");
    setStatus("__all__");
    setRegion("__all__");
    setTipo("__all__");
    setTramo("__all__");
    setSortBy("name-asc");
  }

  async function deleteCommunity(item: AdminCommunityListItem) {
    if (!window.confirm(`¿Eliminar definitivamente la comunidad "${item.name}"?`)) {
      return;
    }

    setDeletingCommunityId(item.communityId);
    setDeleteError("");
    try {
      const response = await fetch(`/api/admin/communities/${item.communityId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar la comunidad");
      }
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "No se pudo eliminar la comunidad"
      );
    } finally {
      setDeletingCommunityId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        Todavía no hay comunidades registradas.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communityQuery">
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="communityQuery"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, slug, región, localidad o tramo"
                className="h-12 rounded-2xl border-slate-200 bg-white pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communityStatus">
              Estado
            </label>
            <select
              id="communityStatus"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="__all__">Todos</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communityRegion">
              Región
            </label>
            <select
              id="communityRegion"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="__all__">Todas</option>
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communityType">
              Tipo
            </label>
            <select
              id="communityType"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
            >
              <option value="__all__">Todos</option>
              {tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communityTramo">
              Tramo
            </label>
            <select
              id="communityTramo"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={tramo}
              onChange={(event) => setTramo(event.target.value)}
            >
              <option value="__all__">Todos</option>
              {tramos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communitySort">
              Ordenar por
            </label>
            <select
              id="communitySort"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
            >
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="region-asc">Región A-Z</option>
              <option value="tipo-asc">Tipo A-Z</option>
              <option value="tramo-asc">Tramo menor a mayor</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {filteredItems.length} de {items.length} comunidades.
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
          No hay comunidades que coincidan con la búsqueda o filtros actuales.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Comunidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Región</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Tramo</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredItems.map((item) => (
                <tr key={item.communityId} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.path || `/${item.slug}`}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        item.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatValue(item.region)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatValue(item.tipo)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatValue(item.tramo)}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200"
                    >
                      <Link href={`/admin/comunidades/${item.communityId}`}>
                        <PenSquare className="h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      disabled={deletingCommunityId === item.communityId}
                      onClick={() => void deleteCommunity(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingCommunityId === item.communityId ? "Eliminando..." : "Eliminar"}
                    </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
