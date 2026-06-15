export const NEWS_IMAGE_ALLOWED_FILE_TYPES = [
  {
    mimeType: "image/jpeg",
    extensions: ["jpg", "jpeg"],
    defaultExtension: "jpg",
    label: "JPG",
  },
  {
    mimeType: "image/png",
    extensions: ["png"],
    defaultExtension: "png",
    label: "PNG",
  },
  {
    mimeType: "image/webp",
    extensions: ["webp"],
    defaultExtension: "webp",
    label: "WEBP",
  },
  {
    mimeType: "image/gif",
    extensions: ["gif"],
    defaultExtension: "gif",
    label: "GIF",
  },
  {
    mimeType: "image/avif",
    extensions: ["avif"],
    defaultExtension: "avif",
    label: "AVIF",
  },
] as const;

export const NEWS_IMAGE_ACCEPT = NEWS_IMAGE_ALLOWED_FILE_TYPES
  .map((item) => item.mimeType)
  .join(",");

export const NEWS_IMAGE_ALLOWED_LABEL = NEWS_IMAGE_ALLOWED_FILE_TYPES
  .map((item) => item.label)
  .join(", ");

export const NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB = 10;

export type AllowedNewsImageType = (typeof NEWS_IMAGE_ALLOWED_FILE_TYPES)[number];

export function getAllowedNewsImageType(input: {
  mimeType?: string | null;
  fileName?: string | null;
}): AllowedNewsImageType | null {
  const normalizedMimeType = String(input.mimeType ?? "")
    .trim()
    .toLowerCase();

  if (normalizedMimeType) {
    const byMimeType = NEWS_IMAGE_ALLOWED_FILE_TYPES.find(
      (item) => item.mimeType === normalizedMimeType
    );
    if (byMimeType) {
      return byMimeType;
    }
  }

  const extension = String(input.fileName ?? "")
    .trim()
    .split(".")
    .pop()
    ?.toLowerCase();

  if (!extension) {
    return null;
  }

  return (
    NEWS_IMAGE_ALLOWED_FILE_TYPES.find((item) =>
      item.extensions.some((itemExtension) => itemExtension === extension)
    ) ?? null
  );
}

export function parseNewsImageMaxUploadMb(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB;
  }

  return Math.min(parsed, 50);
}
