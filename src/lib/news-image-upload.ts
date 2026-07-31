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
] as const;

export const NEWS_IMAGE_ACCEPT = NEWS_IMAGE_ALLOWED_FILE_TYPES
  .map((item) => item.mimeType)
  .join(",");

export const NEWS_IMAGE_ALLOWED_LABEL = NEWS_IMAGE_ALLOWED_FILE_TYPES
  .map((item) => item.label)
  .join(", ");

export const NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB = 5;
export const NEWS_IMAGE_MAX_FILES = 10;

export type AllowedNewsImageType = (typeof NEWS_IMAGE_ALLOWED_FILE_TYPES)[number];

export function getAllowedNewsImageType(input: {
  mimeType?: string | null;
  fileName?: string | null;
}): AllowedNewsImageType | null {
  const normalizedMimeType = String(input.mimeType ?? "")
    .trim()
    .toLowerCase();

  const byMimeType = NEWS_IMAGE_ALLOWED_FILE_TYPES.find(
    (item) => item.mimeType === normalizedMimeType
  );

  const extension = String(input.fileName ?? "")
    .trim()
    .split(".")
    .pop()
    ?.toLowerCase();

  if (!byMimeType || !extension) {
    return null;
  }

  return byMimeType.extensions.some(
    (itemExtension) => itemExtension === extension
  )
    ? byMimeType
    : null;
}

export function parseNewsImageMaxUploadMb(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB;
  }

  return Math.min(parsed, NEWS_IMAGE_DEFAULT_MAX_UPLOAD_MB);
}

function hasBytes(
  bytes: Uint8Array,
  expected: readonly number[],
  offset = 0
): boolean {
  if (bytes.length < offset + expected.length) {
    return false;
  }

  return expected.every((value, index) => bytes[offset + index] === value);
}

export function hasValidNewsImageSignature(
  bytes: Uint8Array,
  mimeType: AllowedNewsImageType["mimeType"]
): boolean {
  switch (mimeType) {
    case "image/jpeg":
      return hasBytes(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return (
        hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
      );
    default:
      return false;
  }
}
