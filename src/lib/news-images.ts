export type NewsImage = {
  newsImageId: string;
  newsId: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
  blobName: string | null;
  createdAt: Date | string;
};

export type NewsImageWriteInput = {
  newsImageId?: string;
  imageUrl: string;
  caption?: string | null;
  sortOrder?: number;
  isCover?: boolean;
  blobName?: string | null;
};

export function mapNewsImageRow(row: Record<string, unknown>): NewsImage {
  const createdAt = row.createdAt;

  if (!(createdAt instanceof Date) && typeof createdAt !== "string") {
    throw new Error("Fecha de imagen de noticia invalida.");
  }

  return {
    newsImageId: String(row.newsImageId),
    newsId: String(row.newsId),
    imageUrl: String(row.imageUrl ?? ""),
    caption: row.caption == null ? null : String(row.caption),
    sortOrder: Number(row.sortOrder),
    isCover: !!row.isCover,
    blobName: row.blobName == null ? null : String(row.blobName),
    createdAt,
  };
}

export function sortNewsImages(images: readonly NewsImage[]): NewsImage[] {
  return [...images].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.newsImageId.localeCompare(right.newsImageId)
  );
}

export function getNewsCoverImage(
  images: readonly NewsImage[]
): NewsImage | null {
  const sortedImages = sortNewsImages(images);
  return (
    sortedImages.find((image) => image.isCover) ??
    sortedImages[0] ??
    null
  );
}

export function assignConsecutiveNewsImageOrders(
  images: readonly NewsImage[]
): NewsImage[] {
  return sortNewsImages(images).map((image, index) => ({
    ...image,
    sortOrder: index + 1,
  }));
}

export function ensureSingleNewsImageCover(
  images: readonly NewsImage[]
): NewsImage[] {
  const coverImage = getNewsCoverImage(images);

  if (!coverImage) {
    return [];
  }

  return images.map((image) => ({
    ...image,
    isCover: image.newsImageId === coverImage.newsImageId,
  }));
}

export function normalizeNewsImages(
  images: readonly NewsImage[]
): NewsImage[] {
  return ensureSingleNewsImageCover(
    assignConsecutiveNewsImageOrders(images)
  );
}
