"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminNewsCommunitiesField, {
  type AdminNewsCommunityOption,
} from "@/components/admin/AdminNewsCommunitiesField";
import AdminNewsImagesField, {
  type AdminNewsImageItem,
  type ExistingAdminNewsImageItem,
  type NewAdminNewsImageItem,
} from "@/components/admin/AdminNewsImagesField";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NEWS_IMAGE_MAX_FILES } from "@/lib/news-image-upload";

type CommunityOption = AdminNewsCommunityOption;

type NewsInitialValues = {
  newsId: string;
  communityId: string;
  communityIds?: string[];
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl: string;
  images: Array<{
    newsImageId: string;
    imageUrl: string;
    blobName: string | null;
    caption: string | null;
    sortOrder: number;
    isCover: boolean;
  }>;
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
  communityIds: string[];
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
  communityIds: [],
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
  items?: Array<{
    url?: string;
    blobName?: string;
    index?: number;
    originalName?: string;
  }>;
  url?: string;
  blobName?: string;
  error?: string;
};

type UploadedNewsImage = {
  url: string;
  blobName: string;
};

type SaveResponse = {
  cleanupPendingBlobNames?: unknown[];
  error?: string;
};

type ProcessStage =
  | "idle"
  | "uploading"
  | "saving"
  | "cleanup-pending";

type ErrorKind = "validation" | "upload" | "save" | null;

class UserFacingError extends Error {}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSelectedCommunityIds(
  communityIds: readonly string[]
): string[] {
  const normalizedCommunityIds: string[] = [];
  const seenCommunityIds = new Set<string>();

  for (const communityId of communityIds) {
    const comparisonKey = communityId.toLowerCase();
    if (!seenCommunityIds.has(comparisonKey)) {
      seenCommunityIds.add(comparisonKey);
      normalizedCommunityIds.push(communityId);
    }
  }

  return normalizedCommunityIds;
}

function createInitialImageItems(
  initialValues: NewsInitialValues | undefined
): AdminNewsImageItem[] {
  const sortedImages = [...(initialValues?.images ?? [])].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.newsImageId.localeCompare(right.newsImageId)
  );
  const coverImageId =
    sortedImages.find((image) => image.isCover)?.newsImageId ??
    sortedImages[0]?.newsImageId;

  return sortedImages.map(
    (image, index): ExistingAdminNewsImageItem => ({
      kind: "existing",
      key: `existing-${image.newsImageId}`,
      newsImageId: image.newsImageId,
      imageUrl: image.imageUrl,
      blobName: image.blobName,
      caption: image.caption ?? "",
      sortOrder: index + 1,
      isCover: image.newsImageId === coverImageId,
    })
  );
}

function getSafeApiError(payload: unknown, fallback: string): string {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("error" in payload) ||
    typeof payload.error !== "string"
  ) {
    return fallback;
  }

  const message = payload.error.trim();
  const safeMessagePrefixes = [
    "Debes seleccionar",
    "La coleccion de comunidades no es valida",
    "La comunidad principal debe estar incluida",
    "Una o mas comunidades seleccionadas no existen",
    "CommunityId",
    "La comunidad seleccionada no existe",
    "La imagen seleccionada esta vacia",
    "La imagen supera el maximo permitido",
    "Solo se permiten",
    "Cada imagen puede",
    "Una noticia puede",
    "Ya existe una noticia con ese slug",
    "Comunidad no encontrada",
    "Noticia no encontrada",
    "Orden inválido",
    "Orden invalido",
  ];

  return safeMessagePrefixes.some((prefix) => message.startsWith(prefix))
    ? message
    : fallback;
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
          communityIds:
            initialValues.communityIds && initialValues.communityIds.length > 0
              ? normalizeSelectedCommunityIds(initialValues.communityIds)
              : [initialValues.communityId],
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
  const [processStage, setProcessStage] =
    useState<ProcessStage>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [imageCollectionError, setImageCollectionError] = useState("");
  const [communitySelectionError, setCommunitySelectionError] = useState("");
  const [newsImages, setNewsImages] = useState<AdminNewsImageItem[]>(() =>
    createInitialImageItems(initialValues)
  );
  const [deletedImageIds, setDeletedImageIds] = useState<Set<string>>(
    () => new Set()
  );

  const isBusy =
    processStage === "uploading" || processStage === "saving";
  const saveCompleted = processStage === "cleanup-pending";

  function handleImagesChange(items: AdminNewsImageItem[]) {
    setNewsImages(items);
    setImageCollectionError("");
    if (errorKind === "validation") {
      setErrorKind(null);
      setErrorMessage("");
    }
  }

  function handleCommunityIdsChange(communityIds: string[]) {
    setForm((current) => ({
      ...current,
      communityIds: normalizeSelectedCommunityIds(communityIds),
    }));
    setCommunitySelectionError("");
    if (errorKind === "validation") {
      setErrorKind(null);
      setErrorMessage("");
    }
  }

  function getPrimaryCommunityId(): string {
    const selectedCommunityIds = form.communityIds;
    if (
      mode === "edit" &&
      initialValues &&
      selectedCommunityIds.some(
        (communityId) =>
          communityId.toLowerCase() === initialValues.communityId.toLowerCase()
      )
    ) {
      return initialValues.communityId;
    }

    return selectedCommunityIds[0] ?? "";
  }

  function handleExistingImageRemoved(newsImageId: string) {
    setDeletedImageIds((current) => {
      const nextIds = new Set(current);
      nextIds.add(newsImageId);
      return nextIds;
    });
  }

  function validateImageCollection(): string | null {
    if (newsImages.length > NEWS_IMAGE_MAX_FILES) {
      return `Una noticia puede tener como máximo ${NEWS_IMAGE_MAX_FILES} imágenes.`;
    }

    if (newsImages.some((image) => image.caption.length > 200)) {
      return "El caption de cada imagen puede tener como máximo 200 caracteres.";
    }

    const coverCount = newsImages.filter((image) => image.isCover).length;
    if (newsImages.length > 0 && coverCount !== 1) {
      return "Selecciona una única imagen de portada.";
    }

    if (newsImages.length === 0 && coverCount !== 0) {
      return "Una noticia sin imágenes no puede tener portada.";
    }

    return null;
  }

  async function uploadNewImages(
    newImages: NewAdminNewsImageItem[]
  ): Promise<UploadedNewsImage[]> {
    const communityId = getPrimaryCommunityId().trim();
    if (!communityId) {
      throw new UserFacingError(
        "Debes seleccionar una comunidad antes de subir las imágenes."
      );
    }

    const uploadData = new FormData();
    for (const image of newImages) {
      uploadData.append("files", image.file);
    }
    uploadData.set("communityId", communityId);

    const response = await fetch("/api/admin/uploads/news-image", {
      method: "POST",
      body: uploadData,
    });

    const payload: UploadResponse = await response.json();
    if (!response.ok) {
      throw new UserFacingError(
        getSafeApiError(
          payload,
          "No se pudieron subir las imágenes. Inténtalo nuevamente."
        )
      );
    }

    if (!payload.items || payload.items.length !== newImages.length) {
      throw new UserFacingError(
        "La carga no devolvió todas las imágenes esperadas. Inténtalo nuevamente."
      );
    }

    return payload.items.map((uploaded, index) => {
      const expectedImage = newImages[index];
      const hasExpectedIdentity =
        (uploaded.index === undefined || uploaded.index === index) &&
        (uploaded.originalName === undefined ||
          uploaded.originalName === expectedImage.file.name);

      if (!uploaded.url || !uploaded.blobName || !hasExpectedIdentity) {
        throw new UserFacingError(
          "No se pudo relacionar una imagen cargada con el archivo seleccionado."
        );
      }

      return {
        url: uploaded.url,
        blobName: uploaded.blobName,
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || saveCompleted) {
      return;
    }

    if (form.communityIds.length === 0) {
      setErrorKind("validation");
      setErrorMessage("Revisa las comunidades antes de guardar.");
      setCommunitySelectionError("Selecciona al menos una comunidad.");
      return;
    }

    const availableCommunityKeys = new Set(
      communities.map((community) => community.communityId.toLowerCase())
    );
    if (
      form.communityIds.some(
        (communityId) => !availableCommunityKeys.has(communityId.toLowerCase())
      )
    ) {
      setErrorKind("validation");
      setErrorMessage("Revisa las comunidades antes de guardar.");
      setCommunitySelectionError(
        "Una de las comunidades seleccionadas ya no esta disponible."
      );
      return;
    }

    const collectionError = validateImageCollection();
    if (collectionError) {
      setErrorKind("validation");
      setErrorMessage("Revisa la colección de imágenes antes de guardar.");
      setImageCollectionError(collectionError);
      return;
    }

    setErrorKind(null);
    setErrorMessage("");
    setSuccessMessage("");
    setImageCollectionError("");
    setCommunitySelectionError("");

    const newImages = newsImages.filter(
      (image): image is NewAdminNewsImageItem => image.kind === "new"
    );
    let activeOperation: Exclude<ErrorKind, "validation" | null> = "save";

    try {
      let uploadedImages: UploadedNewsImage[] = [];

      if (newImages.length > 0) {
        activeOperation = "upload";
        setProcessStage("uploading");
        uploadedImages = await uploadNewImages(newImages);
      }

      activeOperation = "save";
      setProcessStage("saving");
      let uploadedIndex = 0;
      const images = newsImages.map((image, index) => {
        const caption = image.caption.trim() || null;

        if (image.kind === "existing") {
          return {
            newsImageId: image.newsImageId,
            imageUrl: image.imageUrl,
            blobName: image.blobName,
            caption,
            sortOrder: index + 1,
            isCover: image.isCover,
          };
        }

        const uploadedImage = uploadedImages[uploadedIndex];
        uploadedIndex += 1;

        if (!uploadedImage) {
          throw new UserFacingError(
            "Falta una imagen cargada para completar la noticia."
          );
        }

        return {
          imageUrl: uploadedImage.url,
          blobName: uploadedImage.blobName,
          caption,
          sortOrder: index + 1,
          isCover: image.isCover,
        };
      });
      const coverImage = images.find((image) => image.isCover);
      const communityId = getPrimaryCommunityId();
      const endpoint =
        mode === "edit" && initialValues
          ? `/api/admin/news/${initialValues.newsId}`
          : "/api/admin/news";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          communityIds: form.communityIds,
          title: form.title,
          slug: form.slug,
          summary: form.summary,
          bodyHtml: form.bodyHtml,
          imageUrl: coverImage?.imageUrl ?? null,
          images,
          isFeatured: form.isFeatured,
          isPublic: form.isPublic,
          sortOrder: form.sortOrder,
        }),
      });

      const payload: SaveResponse = await response.json();
      if (!response.ok) {
        throw new UserFacingError(
          getSafeApiError(
            payload,
            mode === "edit"
              ? "No se pudo actualizar la noticia."
              : "No se pudo crear la noticia."
          )
        );
      }

      const cleanupPendingCount = Array.isArray(
        payload.cleanupPendingBlobNames
      )
        ? payload.cleanupPendingBlobNames.length
        : 0;

      if (cleanupPendingCount > 0) {
        setProcessStage("cleanup-pending");
        setSuccessMessage(
          "La noticia fue actualizada, pero quedó una limpieza interna pendiente."
        );

        if (process.env.NODE_ENV === "development") {
          console.warn("[admin-news] limpieza interna pendiente", {
            newsId: initialValues?.newsId,
            pendingItemCount: cleanupPendingCount,
            removedImageCount: deletedImageIds.size,
          });
        }
        return;
      }

      router.push("/admin/noticias");
      router.refresh();
    } catch (error) {
      setErrorKind(activeOperation);
      setErrorMessage(
        error instanceof UserFacingError
          ? error.message
          : activeOperation === "upload"
            ? "No se pudieron subir las imágenes."
            : "No se pudo guardar la noticia."
      );
      setProcessStage("idle");
    } finally {
      setProcessStage((current) =>
        current === "cleanup-pending" ? current : "idle"
      );
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
              : "Crea una noticia para una o varias comunidades y guárdala en el portal."}
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
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span className="font-semibold">
            {errorKind === "validation"
              ? "Revisión pendiente: "
              : errorKind === "upload"
                ? "Error de subida: "
                : "No se pudo guardar: "}
          </span>
          {errorMessage}
        </div>
      )}
      {successMessage ? (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <span className="font-semibold">Noticia guardada. </span>
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <fieldset
          className="space-y-6"
          disabled={isBusy || saveCompleted}
        >
        <AdminNewsCommunitiesField
          communities={communities}
          selectedCommunityIds={form.communityIds}
          onChange={handleCommunityIdsChange}
          disabled={isBusy || saveCompleted}
          error={communitySelectionError}
        />

        {initialValues?.savedAtLabel ? (
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        ) : null}

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
          <RichTextEditor
            id="summary"
            value={form.summary}
            onChange={(summary) => setForm((current) => ({ ...current, summary }))}
            minHeightClassName="min-h-28"
            placeholder="Escribe un resumen de la noticia..."
            disabled={isBusy || saveCompleted}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="bodyHtml">
            Cuerpo de la noticia
          </label>
          <RichTextEditor
            id="bodyHtml"
            value={form.bodyHtml}
            onChange={(bodyHtml) => setForm((current) => ({ ...current, bodyHtml }))}
            minHeightClassName="min-h-72"
            placeholder="Escribe el contenido de la noticia..."
            disabled={isBusy || saveCompleted}
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

        <AdminNewsImagesField
          items={newsImages}
          onChange={handleImagesChange}
          onExistingImageRemoved={handleExistingImageRemoved}
          disabled={isBusy || saveCompleted}
          error={imageCollectionError}
        />

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
          <Button
            type="submit"
            className="rounded-full bg-slate-950 px-6 hover:bg-slate-800"
            disabled={isBusy || saveCompleted}
          >
            {processStage === "uploading"
              ? "Subiendo imágenes..."
              : processStage === "saving"
                ? "Guardando..."
                : saveCompleted
                  ? "Noticia guardada"
                  : "Guardar noticia"}
          </Button>
        </div>
        </fieldset>
      </form>
    </section>
  );
}
