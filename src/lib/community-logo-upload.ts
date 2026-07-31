export const COMMUNITY_LOGO_ALLOWED_FILE_TYPES = [
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

export const COMMUNITY_LOGO_ACCEPT = COMMUNITY_LOGO_ALLOWED_FILE_TYPES
  .map((item) => item.mimeType)
  .join(",");

export const COMMUNITY_LOGO_ALLOWED_LABEL = COMMUNITY_LOGO_ALLOWED_FILE_TYPES
  .map((item) => item.label)
  .join(", ");

export const COMMUNITY_LOGO_DEFAULT_MAX_UPLOAD_MB = 10;

export type AllowedCommunityLogoType =
  (typeof COMMUNITY_LOGO_ALLOWED_FILE_TYPES)[number];

export function getAllowedCommunityLogoType(input: {
  mimeType?: string | null;
  fileName?: string | null;
}): AllowedCommunityLogoType | null {
  const normalizedMimeType = String(input.mimeType ?? "")
    .trim()
    .toLowerCase();
  const extension = String(input.fileName ?? "")
    .trim()
    .split(".")
    .pop()
    ?.toLowerCase();
  const allowedType = COMMUNITY_LOGO_ALLOWED_FILE_TYPES.find(
    (item) => item.mimeType === normalizedMimeType
  );

  if (allowedType) {
    return allowedType;
  }

  if (!extension) {
    return null;
  }

  return (
    COMMUNITY_LOGO_ALLOWED_FILE_TYPES.find((item) =>
      item.extensions.some(
        (allowedExtension) => allowedExtension === extension
      )
    ) ?? null
  );
}

export function parseCommunityLogoMaxUploadMb(
  value: string | undefined
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return COMMUNITY_LOGO_DEFAULT_MAX_UPLOAD_MB;
  }

  return Math.min(parsed, 50);
}
