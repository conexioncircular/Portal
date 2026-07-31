export function getSafeApiErrorMessage(
  error: unknown,
  fallback: string,
  allowedPrefixes: readonly string[] = []
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return allowedPrefixes.some((prefix) => error.message.startsWith(prefix))
    ? error.message
    : fallback;
}
