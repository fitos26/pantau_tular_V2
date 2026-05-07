/* istanbul ignore next -- browser-only storage & cookie access */
export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

/* istanbul ignore next -- header composition dependent on env and storage */
export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (process.env.NEXT_PUBLIC_API_KEY) {
    headers["X-API-KEY"] = String(process.env.NEXT_PUBLIC_API_KEY);
  }
  return headers;
}
