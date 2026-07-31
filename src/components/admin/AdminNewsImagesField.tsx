"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Star,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
  NEWS_IMAGE_ACCEPT,
  NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB,
  NEWS_IMAGE_MAX_FILES,
  getAllowedNewsImageType,
} from "@/lib/news-image-upload";

type AdminNewsImageBase = {
  key: string;
  caption: string;
  sortOrder: number;
  isCover: boolean;
};

export type ExistingAdminNewsImageItem = AdminNewsImageBase & {
  kind: "existing";
  newsImageId: string;
  imageUrl: string;
  blobName: string | null;
};

export type NewAdminNewsImageItem = AdminNewsImageBase & {
  kind: "new";
  file: File;
  previewUrl: string;
};

export type AdminNewsImageItem =
  | ExistingAdminNewsImageItem
  | NewAdminNewsImageItem;

type AdminNewsImagesFieldProps = {
  items: AdminNewsImageItem[];
  onChange: (items: AdminNewsImageItem[]) => void;
  onExistingImageRemoved: (newsImageId: string) => void;
  disabled?: boolean;
  error?: string;
};

const MAX_FILE_SIZE_BYTES =
  NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB * 1024 * 1024;

function normalizeCollection(
  items: readonly AdminNewsImageItem[]
): AdminNewsImageItem[] {
  if (items.length === 0) {
    return [];
  }

  const coverKey =
    items.find((item) => item.isCover)?.key ?? items[0].key;

  return items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
    isCover: item.key === coverKey,
  }));
}

function getFileIdentity(file: File): string {
  return `${file.name.toLocaleLowerCase()}:${file.size}:${file.lastModified}`;
}

function createLocalImageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function addUniqueError(errors: string[], message: string) {
  if (!errors.includes(message)) {
    errors.push(message);
  }
}

export default function AdminNewsImagesField({
  items,
  onChange,
  onExistingImageRemoved,
  disabled = false,
  error,
}: AdminNewsImagesFieldProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const ownedPreviewUrls = useRef(new Set<string>());
  const inputId = "news-images";
  const errorId = "news-images-error";

  useEffect(() => {
    const activeUrls = new Set(
      items
        .filter(
          (item): item is NewAdminNewsImageItem => item.kind === "new"
        )
        .map((item) => item.previewUrl)
    );

    for (const previewUrl of ownedPreviewUrls.current) {
      if (!activeUrls.has(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
        ownedPreviewUrls.current.delete(previewUrl);
      }
    }
  }, [items]);

  useEffect(
    () => () => {
      for (const previewUrl of ownedPreviewUrls.current) {
        URL.revokeObjectURL(previewUrl);
      }
      ownedPreviewUrls.current.clear();
    },
    []
  );

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const errors: string[] = [];
    const acceptedFiles: File[] = [];
    const selectedIdentities = new Set(
      items
        .filter(
          (item): item is NewAdminNewsImageItem => item.kind === "new"
        )
        .map((item) => getFileIdentity(item.file))
    );

    for (const file of selectedFiles) {
      if (
        !getAllowedNewsImageType({
          mimeType: file.type,
          fileName: file.name,
        })
      ) {
        addUniqueError(
          errors,
          "Solo se permiten imágenes JPEG, PNG o WebP."
        );
        continue;
      }

      if (file.size === 0) {
        addUniqueError(errors, "No se pueden agregar archivos vacíos.");
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        addUniqueError(
          errors,
          `Cada imagen puede pesar como máximo ${NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB} MB.`
        );
        continue;
      }

      const identity = getFileIdentity(file);
      if (selectedIdentities.has(identity)) {
        addUniqueError(errors, "Esta imagen ya fue seleccionada.");
        continue;
      }

      if (items.length + acceptedFiles.length >= NEWS_IMAGE_MAX_FILES) {
        addUniqueError(
          errors,
          `Una noticia puede tener como máximo ${NEWS_IMAGE_MAX_FILES} imágenes.`
        );
        continue;
      }

      selectedIdentities.add(identity);
      acceptedFiles.push(file);
    }

    if (acceptedFiles.length > 0) {
      const shouldAssignCover = items.length === 0;
      const newItems = acceptedFiles.map((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        ownedPreviewUrls.current.add(previewUrl);

        return {
          kind: "new" as const,
          key: `new-${createLocalImageId()}`,
          file,
          previewUrl,
          caption: "",
          sortOrder: items.length + index + 1,
          isCover: shouldAssignCover && index === 0,
        };
      });

      onChange(normalizeCollection([...items, ...newItems]));
    }

    setValidationErrors(errors);
  }

  function updateItem(
    key: string,
    update: (item: AdminNewsImageItem) => AdminNewsImageItem
  ) {
    onChange(
      normalizeCollection(
        items.map((item) => (item.key === key ? update(item) : item))
      )
    );
  }

  function setCover(key: string) {
    onChange(
      normalizeCollection(
        items.map((item) => ({
          ...item,
          isCover: item.key === key,
        }))
      )
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    [nextItems[index], nextItems[nextIndex]] = [
      nextItems[nextIndex],
      nextItems[index],
    ];
    onChange(normalizeCollection(nextItems));
  }

  function removeItem(item: AdminNewsImageItem) {
    if (
      item.kind === "existing" &&
      !window.confirm(
        "¿Quieres quitar esta imagen de la noticia? El cambio se aplicará al guardar."
      )
    ) {
      return;
    }

    if (item.kind === "new") {
      URL.revokeObjectURL(item.previewUrl);
      ownedPreviewUrls.current.delete(item.previewUrl);
    } else {
      onExistingImageRemoved(item.newsImageId);
    }

    onChange(normalizeCollection(items.filter(({ key }) => key !== item.key)));
  }

  const displayedErrors = [
    ...validationErrors,
    ...(error ? [error] : []),
  ];

  return (
    <fieldset
      className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5"
      disabled={disabled}
      aria-describedby={displayedErrors.length > 0 ? errorId : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <legend className="text-base font-semibold text-slate-950">
            Imágenes de la noticia
          </legend>
          <p className="mt-1 text-sm text-slate-600">
            Puedes agregar hasta 10 imágenes JPEG, PNG o WebP. Máximo 5 MB
            por imagen.
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          {items.length} de {NEWS_IMAGE_MAX_FILES}
        </span>
      </div>

      <div className="space-y-2">
        <label
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
          htmlFor={inputId}
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Agregar imágenes
        </label>
        <input
          id={inputId}
          type="file"
          accept={NEWS_IMAGE_ACCEPT}
          multiple
          onChange={handleFilesSelected}
          className="sr-only"
          disabled={disabled || items.length >= NEWS_IMAGE_MAX_FILES}
          aria-invalid={displayedErrors.length > 0}
          aria-describedby={displayedErrors.length > 0 ? errorId : undefined}
        />
        <p className="text-xs text-slate-500">
          Puedes seleccionar varios archivos ahora y agregar más después.
        </p>
      </div>

      {displayedErrors.length > 0 ? (
        <div
          id={errorId}
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <ul className="space-y-1">
            {displayedErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          La noticia se guardará sin imágenes si no agregas archivos.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const imageSource =
              item.kind === "existing" ? item.imageUrl : item.previewUrl;
            const imageAlt = item.isCover
              ? `Portada de la noticia, imagen ${index + 1}`
              : `Vista previa de la imagen ${index + 1}`;

            return (
              <article
                key={item.key}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  item.isCover
                    ? "border-sky-300 ring-2 ring-sky-100"
                    : "border-slate-200"
                }`}
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  {item.kind === "existing" ? (
                    <Image
                      src={imageSource}
                      alt={imageAlt}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    // Las URL blob locales no deben pasar por el optimizador de Next.js.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSource}
                      alt={imageAlt}
                      className="h-full w-full object-cover"
                    />
                  )}

                  {item.isCover ? (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-sky-700 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                      Portada
                    </span>
                  ) : null}
                </div>

                <div className="space-y-4 p-4">
                  <div className="min-h-5">
                    {item.kind === "new" ? (
                      <p
                        className="truncate text-xs font-medium text-slate-600"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-slate-500">
                        Imagen guardada
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor={`caption-${item.key}`}
                        className="text-sm font-medium text-slate-700"
                      >
                        Caption opcional
                      </label>
                      <span className="text-xs text-slate-500">
                        {item.caption.length}/200
                      </span>
                    </div>
                    <textarea
                      id={`caption-${item.key}`}
                      value={item.caption}
                      maxLength={200}
                      onChange={(event) =>
                        updateItem(item.key, (current) => ({
                          ...current,
                          caption: event.target.value,
                        }))
                      }
                      className="min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder="Descripción breve de la imagen"
                    />
                  </div>

                  {!item.isCover ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full rounded-full border-slate-200"
                      onClick={() => setCover(item.key)}
                      aria-label={`Usar la imagen ${index + 1} como portada`}
                    >
                      <Star className="h-4 w-4" aria-hidden="true" />
                      Usar como portada
                    </Button>
                  ) : null}

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-xl border-slate-200 px-2"
                      onClick={() => moveItem(index, -1)}
                      disabled={disabled || index === 0}
                      aria-label={`Subir la imagen ${index + 1}`}
                      title="Subir"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-xl border-slate-200 px-2"
                      onClick={() => moveItem(index, 1)}
                      disabled={disabled || index === items.length - 1}
                      aria-label={`Bajar la imagen ${index + 1}`}
                      title="Bajar"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-xl border-red-200 px-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => removeItem(item)}
                      aria-label={`Quitar la imagen ${index + 1}`}
                      title="Quitar"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
