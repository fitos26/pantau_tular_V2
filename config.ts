const DEFAULT_API_ORIGIN = "http://127.0.0.1:8000";
const rawApiBase = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_ORIGIN;

const normalizeApiOrigin = (value?: string | null) => {
  if (!value || value.trim() === "") {
    return DEFAULT_API_ORIGIN;
  }

  const trimmed = value.trim().replace(/\/+$/, "");

  const withoutApiSuffix = trimmed.endsWith("/api")
    ? trimmed.slice(0, -4)
    : trimmed;

  return withoutApiSuffix.replace("://localhost", "://127.0.0.1");
};

const assertValidApiBase = (value: string) => {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    return value;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_API_URL tidak valid: "${value}". Periksa file .env.local`,
    );
  }
};

export const API_BASE_RAW = rawApiBase;
export const API_ORIGIN = normalizeApiOrigin(rawApiBase);
export const API_BASE = assertValidApiBase(API_ORIGIN);
export const API_API_BASE = `${API_BASE}/api`;

console.log("API_BASE_RAW =", API_BASE_RAW);
console.log("API_BASE =", API_BASE);
console.log("API_API_BASE =", API_API_BASE);
