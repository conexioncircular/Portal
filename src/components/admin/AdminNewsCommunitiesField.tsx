"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminNewsCommunityOption = {
  communityId: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type AdminNewsCommunitiesFieldProps = {
  communities: readonly AdminNewsCommunityOption[];
  selectedCommunityIds: readonly string[];
  onChange: (communityIds: string[]) => void;
  disabled?: boolean;
  error?: string;
};

const MAX_VISIBLE_CHIPS = 6;

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function sortCommunities(
  communities: readonly AdminNewsCommunityOption[]
): AdminNewsCommunityOption[] {
  return [...communities].sort(
    (left, right) =>
      left.name.localeCompare(right.name, "es", { sensitivity: "base" }) ||
      left.communityId.localeCompare(right.communityId, "en", {
        sensitivity: "base",
      })
  );
}

export default function AdminNewsCommunitiesField({
  communities,
  selectedCommunityIds,
  onChange,
  disabled = false,
  error,
}: AdminNewsCommunitiesFieldProps) {
  const [query, setQuery] = useState("");
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedKeys = useMemo(
    () =>
      new Set(
        selectedCommunityIds.map((communityId) => communityId.toLowerCase())
      ),
    [selectedCommunityIds]
  );
  const sortedCommunities = useMemo(
    () => sortCommunities(communities),
    [communities]
  );
  // El formulario anterior permitia seleccionar manualmente comunidades
  // inactivas. Se conserva esa compatibilidad, pero "Seleccionar todas"
  // incluye exclusivamente las activas.
  const selectableCommunities = sortedCommunities;
  const activeCommunities = useMemo(
    () => sortedCommunities.filter((community) => community.isActive),
    [sortedCommunities]
  );
  const normalizedQuery = normalizeSearchValue(query);
  const filteredCommunities = useMemo(
    () =>
      selectableCommunities.filter((community) =>
        normalizeSearchValue(community.name).includes(normalizedQuery)
      ),
    [normalizedQuery, selectableCommunities]
  );
  const selectedCommunities = useMemo(
    () =>
      sortedCommunities.filter((community) =>
        selectedKeys.has(community.communityId.toLowerCase())
      ),
    [selectedKeys, sortedCommunities]
  );
  const selectedActiveCount = activeCommunities.filter((community) =>
    selectedKeys.has(community.communityId.toLowerCase())
  ).length;
  const allActiveSelected =
    activeCommunities.length > 0 &&
    selectedActiveCount === activeCommunities.length;
  const someActiveSelected =
    selectedActiveCount > 0 && !allActiveSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someActiveSelected;
    }
  }, [someActiveSelected]);

  function toggleCommunity(communityId: string, checked: boolean) {
    const comparisonKey = communityId.toLowerCase();
    if (checked) {
      if (!selectedKeys.has(comparisonKey)) {
        onChange([...selectedCommunityIds, communityId]);
      }
      return;
    }

    onChange(
      selectedCommunityIds.filter(
        (selectedCommunityId) =>
          selectedCommunityId.toLowerCase() !== comparisonKey
      )
    );
  }

  function toggleAllActive(checked: boolean) {
    if (!checked) {
      onChange([]);
      return;
    }

    const nextCommunityIds = [...selectedCommunityIds];
    const nextKeys = new Set(selectedKeys);
    for (const community of activeCommunities) {
      const comparisonKey = community.communityId.toLowerCase();
      if (!nextKeys.has(comparisonKey)) {
        nextKeys.add(comparisonKey);
        nextCommunityIds.push(community.communityId);
      }
    }
    onChange(nextCommunityIds);
  }

  const errorId = error ? "news-communities-error" : undefined;
  const summaryId = "news-communities-summary";
  const hiddenSelectionCount = Math.max(
    selectedCommunities.length - MAX_VISIBLE_CHIPS,
    0
  );

  return (
    <fieldset
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5"
      aria-describedby={[summaryId, errorId].filter(Boolean).join(" ")}
      disabled={disabled}
    >
      <legend className="text-base font-semibold text-slate-900">
        Comunidades donde se publicará
      </legend>
      <div className="space-y-1">
        <p className="text-sm leading-6 text-slate-600">
          Selecciona una o varias comunidades. La noticia y sus imágenes se
          guardarán una sola vez y aparecerán en todos los portales
          seleccionados.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full space-y-2 sm:max-w-md">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="newsCommunitySearch"
          >
            Buscar comunidades
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="newsCommunitySearch"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre"
              className="h-12 rounded-2xl border-slate-200 bg-white pl-10"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-full border-slate-200 bg-white"
          onClick={() => onChange([])}
          disabled={disabled || selectedCommunityIds.length === 0}
        >
          Limpiar selección
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-inset">
          <input
            ref={selectAllRef}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={allActiveSelected}
            aria-checked={someActiveSelected ? "mixed" : allActiveSelected}
            onChange={(event) => toggleAllActive(event.target.checked)}
            disabled={disabled || activeCommunities.length === 0}
          />
          <span>Seleccionar todas</span>
          <span className="ml-auto text-xs font-normal text-slate-500">
            {activeCommunities.length} activas
          </span>
        </label>

        <div className="max-h-72 overflow-y-auto p-2">
          {filteredCommunities.length > 0 ? (
            <div className="space-y-1">
              {filteredCommunities.map((community) => {
                const checkboxId = `news-community-${community.communityId}`;
                const checked = selectedKeys.has(
                  community.communityId.toLowerCase()
                );

                return (
                  <label
                    key={community.communityId}
                    htmlFor={checkboxId}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-within:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-400"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border-slate-300"
                      checked={checked}
                      onChange={(event) =>
                        toggleCommunity(
                          community.communityId,
                          event.target.checked
                        )
                      }
                    />
                    <span className="min-w-0 flex-1 font-medium text-slate-800">
                      {community.name}
                    </span>
                    {!community.isActive ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        Inactiva
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No se encontraron comunidades
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p id={summaryId} className="text-sm font-semibold text-slate-800">
          {selectedCommunityIds.length === 1
            ? "1 comunidad seleccionada"
            : `${selectedCommunityIds.length} comunidades seleccionadas`}
        </p>

        {selectedCommunities.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label="Comunidades seleccionadas">
            {selectedCommunities
              .slice(0, MAX_VISIBLE_CHIPS)
              .map((community) => (
                <span
                  key={community.communityId}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-sm text-slate-700"
                >
                  <span>{community.name}</span>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    aria-label={`Quitar ${community.name}`}
                    onClick={() => toggleCommunity(community.communityId, false)}
                    disabled={disabled}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
            {hiddenSelectionCount > 0 ? (
              <span className="inline-flex min-h-9 items-center rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                y {hiddenSelectionCount} más
              </span>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
