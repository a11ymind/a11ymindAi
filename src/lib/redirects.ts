export function safeAppRedirectPath(
  input: string | null | undefined,
  fallback: string,
): string {
  if (!input) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (input.includes("://")) return fallback;
  return input;
}
