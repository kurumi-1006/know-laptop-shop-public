export function getSafeRedirect(
  redirect: string | null | undefined,
  fallback = "/",
) {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(redirect, "https://know.local");

    if (url.origin !== "https://know.local") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
