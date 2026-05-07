type Row = {
  data_id: string;
  file_name: string;
  last_edited: string;
  submitted_by: string;
};

export function getToken(): string | null {
  try {
    const raw = window.localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) return String(parsed.access_token);
      if (parsed?.token) return String(parsed.token);
    }
    const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
    return token || null;
  } catch {
    return null;
  }
}

export function getTokenForDelete(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) return String(parsed.access_token);
      if (parsed?.token) return String(parsed.token);
    }
  } catch {
    // Fall through to storage and cookie fallbacks.
  }

  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  try {
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // Ignore cookie access failures.
  }
  return null;
}

export function filterRows(rows: Row[], query: string): Row[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    [row.data_id, row.file_name, row.last_edited, row.submitted_by].join(" ").toLowerCase().includes(q)
  );
}
