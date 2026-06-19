import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown, fallback = "Đã xảy ra lỗi"): string {
  if (error instanceof Error) return error.message;
  const e = error as { response?: { data?: { error?: string } }; message?: string; status?: number };
  return e?.response?.data?.error ?? e?.message ?? fallback;
}

export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal) as unknown as T;
  }

  if (typeof obj === "object") {
    const maybeDecimal = obj as { toNumber?: () => number };
    if (typeof maybeDecimal.toNumber === "function") {
      return maybeDecimal.toNumber() as unknown as T;
    }

    if (obj instanceof Date) {
      return obj as unknown as T;
    }

    const newObj: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = serializeDecimal((obj as Record<string, unknown>)[key]);
    }
    return newObj as T;
  }

  return obj;
}

export function getLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) return null;
  const normalized = logo.replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith("blob:")) {
    return normalized;
  }
  const match = normalized.match(/(?:^|\/)public\/(.+)$/);
  if (match) {
    return "/" + match[1];
  }
  return normalized.startsWith("/") ? normalized : "/" + normalized;
}

export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) {
    return null;
  }

  try {
    const parts = url.split("/image/upload/");
    if (parts.length < 2) return null;

    const afterUpload = parts[1];
    const subParts = afterUpload.split("/");
    if (subParts.length < 2) return null;

    let startIndex = 0;
    if (subParts[0].startsWith("v") && /^\d+$/.test(subParts[0].substring(1))) {
      startIndex = 1;
    }

    const publicIdWithExt = subParts.slice(startIndex).join("/");
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return publicIdWithExt;
    }
    return publicIdWithExt.substring(0, lastDotIndex);
  } catch (error) {
    console.error("Failed to extract Cloudinary public_id", error);
    return null;
  }
}


