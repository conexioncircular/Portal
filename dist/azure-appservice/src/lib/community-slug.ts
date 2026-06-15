export function normalizeCommunitySlug(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

export function buildCommunityPath(slug: string): string {
  const normalizedSlug = normalizeCommunitySlug(slug);
  return normalizedSlug ? `/comunidades/${normalizedSlug}` : "/comunidades";
}
