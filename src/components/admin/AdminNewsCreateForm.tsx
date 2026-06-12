"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NEWS_IMAGE_ACCEPT,
  NEWS_IMAGE_ALLOWED_LABEL,
  NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB,
  getAllowedNewsImageType,
} from "@/lib/news-image-upload";

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
  publishedAt?: string;
  savedAtLabel?: string;
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

type UploadResponse = {
  url?: string;
  error?: string;
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
          publishedAt: initialValues.publishedAt ?? "",
        }
      : INITIAL_FORM
  );
  const [slugDirty, setSlugDirty] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);

  useEffect(() => {
    if (!pendingImageFile) {
      setPendingImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(pendingImageFile);
    setPendingImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingImageFile]);

  const isBusy = saving || uploadingImage;
  const previewUrl = pendingImagePreviewUrl || form.imageUrl;

  function resetPendingImage() {
    setPendingImageFile(null);
    setImageInputKey((current) => current + 1);
  }

  function clearImage() {
    resetPendingImage();
    setForm((current) => ({ ...current, imageUrl: "" }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setErrorMessage("");

    if (!nextFile) {
      setPendingImageFile(null);
      return;
    }

    if (
      !getAllowedNewsImageType({
        mimeType: nextFile.type,
        fileName: nextFile.name,
      })
    ) {
      setErrorMessage(
        `Formato de imagen no soportado. Usa ${NEWS_IMAGE_ALLOWED_LABEL}.`
      );
      resetPendingImage();
      return;
    }

    setPendingImageFile(nextFile);
  }

  async function uploadPendingImage(file: File): Promise<string> {
    const communityId = form.communityId.trim();
    if (!communityId) {
      throw new Error("Debes seleccionar una comunidad antes de subir la imagen.");
    }

    const uploadData = new FormData();
    uploadData.set("file", file);
    uploadData.set("communityId", communityId);

    const response = await fetch("/api/admin/uploads/news-image", {
      method: "POST",
      body: uploadData,
    });

    const payload = (await response.json()) as UploadResponse;
    if (!response.ok || !payload?.url) {
      throw new Error(payload?.error || "No se pudo subir la imagen");
    }

    return payload.url;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      let imageUrl = form.imageUrl.trim();

      if (pendingImageFile) {
        setUploadingImage(true);
        const uploadedImageUrl = await uploadPendingImage(pendingImageFile);
        imageUrl = uploadedImageUrl;
        setForm((current) => ({ ...current, imageUrl: uploadedImageUrl }));
        resetPendingImage();
        setUploadingImage(false);
      }

      const endpoint =
        mode === "edit" && initialValues
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
          imageUrl: imageUrl || null,
          isFeatured: form.isFeatured,
          isPublic: form.isPublic,
          sortOrder: form.sortOrder,
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
      setUploadingImage(false);
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            {mode === "edit" ? "Editar noticia" : "Nueva noticia"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {mode === "edit"
              ? "Actualiza el contenido y la publicación de esta noticia."
              : "Crea una noticia para una comunidad y guárdala en el portal."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-full border-slate-200"
          onClick={() => router.push("/admin/noticias")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Button>
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

          {initialValues?.savedAtLabel ? (
            <div className="space-y-2">
              <div className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                {`Registrada: ${initialValues.savedAtLabel}`}
              </div>
            <label className="hidden text-sm font-medium text-slate-700" htmlFor="publishedAt">
              Fecha de publicación
            </label>
            <Input
              id="publishedAt"
              type="datetime-local"
              value={form.publishedAt}
              onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))}
              className="hidden h-12 rounded-2xl border-slate-200 bg-slate-50"
              readOnly
              disabled
            />
            </div>
          ) : null}
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

        <div className={`grid gap-4 ${initialValues?.savedAtLabel ? "md:grid-cols-2" : ""}`}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="sortOrder">
              Orden
            </label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
            </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="newsImage">
              Imagen de la noticia
            </label>
            <Input
              key={imageInputKey}
              id="newsImage"
              type="file"
              accept={NEWS_IMAGE_ACCEPT}
              onChange={handleImageChange}
              className="h-auto rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800"
              disabled={isBusy}
            />
            <p className="text-xs text-slate-500">
              Selecciona una imagen desde tu PC o celular. Formatos permitidos: {NEWS_IMAGE_ALLOWED_LABEL}. Maximo recomendado: {NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB} MB.
            </p>
            {pendingImageFile ? (
              <p className="text-sm text-sky-700">
                Archivo listo para subir: {pendingImageFile.name}
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa de la noticia"
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-slate-500">
                La noticia se guardará sin imagen hasta que selecciones un archivo.
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="imageUrl">
                URL almacenada
              </label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                readOnly
                className="h-12 rounded-2xl border-slate-200 bg-slate-100 text-slate-500"
              />
            </div>

            <div className="flex items-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200"
                onClick={resetPendingImage}
                disabled={!pendingImageFile || isBusy}
              >
                Descartar archivo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200"
                onClick={clearImage}
                disabled={isBusy || (!pendingImageFile && !form.imageUrl)}
              >
                Quitar imagen
              </Button>
            </div>
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
          <Button type="submit" className="rounded-full bg-slate-950 px-6 hover:bg-slate-800" disabled={isBusy}>
            {uploadingImage ? "Subiendo imagen..." : saving ? "Guardando..." : "Guardar noticia"}
          </Button>
        </div>
      </form>
    </section>
  );
}
