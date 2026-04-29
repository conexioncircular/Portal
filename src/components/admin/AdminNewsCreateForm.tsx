"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CommunityOption = {
  communityId: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type NewsInitialValues = {
  newsId: string;
  communityId: string;
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl: string;
  isFeatured: boolean;
  isPublic: boolean;
  sortOrder: string;
  publishedAt: string;
};

type AdminNewsCreateFormProps = {
  communities: CommunityOption[];
  initialValues?: NewsInitialValues;
  mode?: "create" | "edit";
};

type FormState = {
  communityId: string;
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl: string;
  isFeatured: boolean;
  isPublic: boolean;
  sortOrder: string;
  publishedAt: string;
};

const INITIAL_FORM: FormState = {
  communityId: "",
  title: "",
  slug: "",
  summary: "",
  bodyHtml: "",
  imageUrl: "",
  isFeatured: false,
  isPublic: true,
  sortOrder: "",
  publishedAt: "",
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateTimeLocal(value: string | Date | null | undefined): string {
  if (!value) {
    return "";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export default function AdminNewsCreateForm({
  communities,
  initialValues,
  mode = "create",
}: AdminNewsCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initialValues
      ? {
          communityId: initialValues.communityId,
          title: initialValues.title,
          slug: initialValues.slug,
          summary: initialValues.summary,
          bodyHtml: initialValues.bodyHtml,
          imageUrl: initialValues.imageUrl,
          isFeatured: initialValues.isFeatured,
          isPublic: initialValues.isPublic,
          sortOrder: initialValues.sortOrder,
          publishedAt: initialValues.publishedAt,
        }
      : INITIAL_FORM
  );
  const [slugDirty, setSlugDirty] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const endpoint = mode === "edit" && initialValues
        ? `/api/admin/news/${initialValues.newsId}`
        : "/api/admin/news";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: form.communityId,
          title: form.title,
          slug: form.slug,
          summary: form.summary,
          bodyHtml: form.bodyHtml,
          imageUrl: form.imageUrl,
          isFeatured: form.isFeatured,
          isPublic: form.isPublic,
          sortOrder: form.sortOrder,
          publishedAt: form.publishedAt || null,
        }),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error: string }).error)
            : "No se pudo guardar la noticia"
        );
      }

      router.push("/admin/noticias");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la noticia");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-950">{mode === "edit" ? "Editar noticia" : "Nueva noticia"}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "edit"
            ? "Actualiza el contenido y la publicación de esta noticia."
            : "Crea una noticia para una comunidad y guárdala en el portal."}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communityId">
              Comunidad
            </label>
            <select
              id="communityId"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800"
              value={form.communityId}
              onChange={(event) => setForm((current) => ({ ...current, communityId: event.target.value }))}
              required
            >
              <option value="">Selecciona una comunidad</option>
              {communities.map((community) => (
                <option key={community.communityId} value={community.communityId}>
                  {community.name}{community.isActive ? "" : " (inactiva)"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="publishedAt">
              Fecha de publicación
            </label>
            <Input
              id="publishedAt"
              type="datetime-local"
              value={form.publishedAt}
              onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Título
            </label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                setForm((current) => ({
                  ...current,
                  title,
                  slug: slugDirty ? current.slug : slugify(title),
                }));
              }}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="slug">
                Slug
              </label>
              <button
                type="button"
                className="text-xs font-medium text-sky-700 hover:text-sky-800"
                onClick={() => {
                  setSlugDirty(false);
                  setForm((current) => ({ ...current, slug: slugify(current.title) }));
                }}
              >
                Regenerar
              </button>
            </div>
            <Input
              id="slug"
              value={form.slug}
              onChange={(event) => {
                setSlugDirty(true);
                setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
              }}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="summary">
            Resumen
          </label>
          <textarea
            id="summary"
            value={form.summary}
            onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-300"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="bodyHtml">
            Cuerpo de la noticia
          </label>
          <textarea
            id="bodyHtml"
            value={form.bodyHtml}
            onChange={(event) => setForm((current) => ({ ...current, bodyHtml: event.target.value }))}
            className="min-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 outline-none transition focus:border-slate-300"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="imageUrl">
              URL de imagen
            </label>
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="sortOrder">
              Orden
            </label>
            <Input
              id="sortOrder"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={form.isFeatured}
              onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))}
            />
            Noticia destacada
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={form.isPublic}
              onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))}
            />
            Noticia pública
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-full border-slate-200" onClick={() => router.push("/admin/noticias")}>Cancelar</Button>
          <Button type="submit" className="rounded-full bg-slate-950 px-6 hover:bg-slate-800" disabled={saving}>
            {saving ? "Guardando..." : "Guardar noticia"}
          </Button>
        </div>
      </form>
    </section>
  );
}