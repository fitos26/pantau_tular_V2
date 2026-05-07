import { API_API_BASE, API_BASE } from "../config";
import {
  MapLocation,
  ClimatePeriod,
  FilterState,
  FilterLike,
  FilterStateDashboard,
  MapViewport,
  ProvinceData,
  ExpertBatch,
  SpatialComparisonResponse,
} from "../types";

const API_BASE_URL = API_BASE;
const API_V1_BASE_URL = API_API_BASE;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const provinceDataCache = new Map<string, ProvinceData[]>();
let filterOptionsCache: any | null = null;
let filterOptionsPromise: Promise<any> | null = null;
let expertBatchesCache: ExpertBatch[] | null = null;
let expertBatchesPromise: Promise<ExpertBatch[]> | null = null;

const caseDetailCache = new Map<string, any>();
const caseDetailPromiseCache = new Map<string, Promise<any>>();

const severityCache = new Map<string, any>();
const severityPromiseCache = new Map<string, Promise<any>>();

const REQUEST_TIMEOUT = 20000;

const decodeJwt = (token: string) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string) => {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
};

const withTimeout = async (url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const safeReadBody = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch {
    return null;
  }
};

const buildNetworkErrorMessage = (url: string, error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return `Request timeout saat mengakses ${url}`;
  }

  try {
    const parsedUrl = new URL(url);
    const isLocalDjangoTarget =
      ["localhost", "127.0.0.1"].includes(parsedUrl.hostname) &&
      parsedUrl.port === "8000";

    if (isLocalDjangoTarget) {
      return `Tidak bisa terhubung ke Django backend di ${parsedUrl.origin}. Pastikan server backend sedang berjalan, misalnya dengan \`.\\.venv\\Scripts\\python.exe manage.py runserver\` dari folder \`backend\`.`;
    }
  } catch {
    // Fall back to generic messaging when URL parsing fails.
  }

  const message =
    error instanceof Error ? error.message : "Unknown network error";

  return `Gagal menghubungi server di ${url}. Detail: ${message}`;
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: error,
  };
};

const fetchJson = async <T = any>(
  url: string,
  options: RequestInit,
  customErrorMessage?: string
): Promise<T> => {
  try {
    console.log("[API] Request URL:", url);
    console.log("[API] Request options:", options);

    const response = await withTimeout(url, options);

    console.log("[API] Response status:", response.status);
    console.log("[API] Response ok:", response.ok);

    if (!response.ok) {
      const errorBody = await safeReadBody(response);
      console.error("[API] Error response body:", errorBody);

      const detail =
        typeof errorBody === "string"
          ? errorBody
          : errorBody?.detail ||
            errorBody?.message ||
            errorBody?.error ||
            null;

      throw new Error(
        customErrorMessage ||
          detail ||
          `HTTP error! status: ${response.status}`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("[API] Network / fetch error:", error);
    throw new Error(
      customErrorMessage || buildNetworkErrorMessage(url, error)
    );
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const payload = await fetchJson<any>(
      `${API_V1_BASE_URL}/token/refresh`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": String(API_KEY) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ refresh: refreshToken }),
      },
      "Gagal melakukan refresh token"
    );

    const nextAccessToken = payload?.access_token ?? payload?.access ?? null;

    if (nextAccessToken) {
      localStorage.setItem("accessToken", nextAccessToken);
      return nextAccessToken;
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return null;
  } catch (error) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    console.error("Refresh token failed:", error);
    return null;
  }
};

const getValidAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem("accessToken");
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  return await refreshAccessToken();
};

const buildAuthorizedHeaders = async (): Promise<Record<string, string>> => {
  const accessToken = await getValidAccessToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": String(API_KEY) } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
};

const buildPublicHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(API_KEY ? { "x-api-key": String(API_KEY) } : {}),
});

const normalizeDateValue = (value?: string | Date | null) => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
};

const getFilterLocations = (filter?: FilterLike) => {
  if (!filter) {
    return [];
  }

  if (Array.isArray((filter as FilterState).locations)) {
    return (filter as FilterState).locations;
  }

  const dashboardFilter = filter as FilterStateDashboard;
  return [
    ...(dashboardFilter.locations?.provinces || []),
    ...(dashboardFilter.locations?.cities || []),
  ];
};

const normalizeFilterForCache = (filter?: FilterLike) => {
  if (!filter) return null;

  return {
    diseases: filter.diseases,
    locations: getFilterLocations(filter),
    portals: filter.portals,
    level_of_alertness: filter.level_of_alertness,
    start_date: normalizeDateValue(filter.start_date),
    end_date: normalizeDateValue(filter.end_date),
    batch: filter.batch ?? null,
  };
};

const normalizeFilterPayload = (filter?: FilterLike) => {
  if (!filter) return undefined;

  return {
    diseases: filter.diseases,
    locations: getFilterLocations(filter),
    portals: filter.portals,
    level_of_alertness: filter.level_of_alertness,
    start_date: normalizeDateValue(filter.start_date),
    end_date: normalizeDateValue(filter.end_date),
    batch: filter.batch ?? null,
  };
};

const appendFilterParams = (params: URLSearchParams, filter?: FilterLike) => {
  const payload = normalizeFilterPayload(filter);
  if (!payload) {
    return;
  }

  payload.diseases.forEach((item: string) => params.append("disease", item));
  payload.locations.forEach((item: string) => params.append("location", item));
  payload.portals.forEach((item: string) => params.append("portal", item));

  if (payload.level_of_alertness) {
    params.set("level_of_alertness", String(payload.level_of_alertness));
  }
  if (payload.start_date) {
    params.set("start_date", String(payload.start_date));
  }
  if (payload.end_date) {
    params.set("end_date", String(payload.end_date));
  }
  if (payload.batch) {
    params.set("batch", payload.batch);
  }
};

const appendViewportParams = (params: URLSearchParams, viewport?: MapViewport) => {
  if (!viewport) {
    return;
  }

  params.set("min_lat", String(viewport.minLat));
  params.set("max_lat", String(viewport.maxLat));
  params.set("min_lng", String(viewport.minLng));
  params.set("max_lng", String(viewport.maxLng));
  params.set("zoom", String(viewport.zoom));
};

const appendClimatePeriodParams = (params: URLSearchParams, period?: ClimatePeriod | null) => {
  if (!period) {
    return;
  }

  if (period.year) {
    params.set("year", String(period.year));
  }
  if (period.month) {
    params.set("month", String(period.month));
  }
};

const buildUrlWithParams = (baseUrl: string, configure?: (params: URLSearchParams) => void) => {
  const params = new URLSearchParams();
  configure?.(params);
  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
};

export const mapApi = {
  async getFilterOptions(): Promise<any> {
    if (filterOptionsCache) {
      return filterOptionsCache;
    }

    if (filterOptionsPromise) {
      return filterOptionsPromise;
    }

    filterOptionsPromise = (async () => {
      const payload = await fetchJson<any>(
        `${API_BASE_URL}/api/filters/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
        "Failed to fetch filter options"
      );

      filterOptionsCache = payload;
      return payload;
    })();

    try {
      return await filterOptionsPromise;
    } finally {
      filterOptionsPromise = null;
    }
  },

  async getLocations(): Promise<MapLocation[]> {
    const url = `${API_BASE_URL}/cases/locations/`;

    try {
      return await fetchJson<MapLocation[]>(
        url,
        {
          method: "GET",
          headers: buildPublicHeaders(),
          credentials: "include",
        },
        `Gagal mengambil data locations dari ${url}`
      );
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw error;
    }
  },

  async getFilteredLocations(filters: FilterState): Promise<MapLocation[]> {
    const payload = normalizeFilterPayload(filters);
    const url = `${API_BASE_URL}/cases/locations/`;

    try {
      console.log("[getFilteredLocations] payload:", payload);

      return await fetchJson<MapLocation[]>(
        url,
        {
          method: "POST",
          headers: buildPublicHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        },
        `Gagal mengambil filtered locations dari ${url}`
      );
    } catch (error) {
      console.error("Error fetching filtered locations:", {
        url,
        payload,
        error: serializeError(error),
      });
      throw error;
    }
  },

  async getMapData(filters?: FilterLike, viewport?: MapViewport): Promise<MapLocation[]> {
    const url = buildUrlWithParams(`${API_V1_BASE_URL}/map-data/`, (params) => {
      appendFilterParams(params, filters);
      appendViewportParams(params, viewport);
    });

    try {
      return await fetchJson<MapLocation[]>(
        url,
        {
          method: "GET",
          headers: buildPublicHeaders(),
          credentials: "include",
        },
        `Gagal mengambil map data dari ${url}`
      );
    } catch (error) {
      console.error("Error fetching map data:", error);
      throw error;
    }
  },

  async getSpatialComparisons(payload: {
    regions: Array<Record<string, unknown>>;
  }): Promise<SpatialComparisonResponse> {
    const url = `${API_BASE_URL}/cases/spatial-comparisons/`;

    try {
      return await fetchJson<SpatialComparisonResponse>(
        url,
        {
          method: "POST",
          headers: buildPublicHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        },
        `Gagal mengambil spatial comparisons dari ${url}`
      );
    } catch (error) {
      console.error("Error fetching spatial comparisons:", error);
      throw error;
    }
  },

  async getDashboardData(filters?: FilterLike): Promise<any> {
    const url = buildUrlWithParams(`${API_V1_BASE_URL}/statistics/`, (params) => {
      appendFilterParams(params, filters);
    });

    try {
      return await fetchJson<any>(
        url,
        {
          method: "GET",
          headers: buildPublicHeaders(),
          credentials: "include",
        },
        `Gagal mengambil dashboard data dari ${url}`
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  },

  async getCaseDetail(caseId: string): Promise<any> {
    const url = `${API_V1_BASE_URL}/map-detail/${caseId}/`;

    try {
      if (caseDetailCache.has(caseId)) {
        return caseDetailCache.get(caseId);
      }

      if (caseDetailPromiseCache.has(caseId)) {
        return await caseDetailPromiseCache.get(caseId);
      }

      const requestPromise = (async () => {
        const payload = await fetchJson<any>(
          url,
          {
            method: "GET",
            headers: buildPublicHeaders(),
            credentials: "include",
          },
          `Gagal mengambil detail case ${caseId}`
        );

        caseDetailCache.set(caseId, payload);
        return payload;
      })();

      caseDetailPromiseCache.set(caseId, requestPromise);

      try {
        return await requestPromise;
      } finally {
        caseDetailPromiseCache.delete(caseId);
      }
    } catch (error) {
      console.error("Error fetching case detail:", error);
      throw error;
    }
  },

  async getProvinceData(dataType: string, period?: ClimatePeriod | null): Promise<ProvinceData[]> {
    const cacheKey = JSON.stringify({ dataType, period: period || null });
    const url = buildUrlWithParams(`${API_V1_BASE_URL}/province-${dataType}/`, (params) => {
      appendClimatePeriodParams(params, period);
    });

    try {
      if (provinceDataCache.has(cacheKey)) {
        return provinceDataCache.get(cacheKey) || [];
      }

      const payload = await fetchJson<ProvinceData[]>(
        url,
        {
          method: "GET",
          headers: buildPublicHeaders(),
          credentials: "include",
        },
        `Gagal mengambil province data dari ${url}`
      );

      provinceDataCache.set(cacheKey, payload);
      return payload;
    } catch (error) {
      console.error("Error fetching province data:", error);
      throw error;
    }
  },

  async getProvinceCaseHeatmapData(filters?: FilterLike): Promise<ProvinceData[]> {
    const url = buildUrlWithParams(`${API_V1_BASE_URL}/province-case-heatmap/`, (params) => {
      appendFilterParams(params, filters);
    });

    try {
      return await fetchJson<ProvinceData[]>(
        url,
        {
          method: "GET",
          headers: buildPublicHeaders(),
          credentials: "include",
        },
        `Gagal mengambil heatmap provinsi dari ${url}`
      );
    } catch (error) {
      console.error("Error fetching province case heatmap data:", error);
      throw error;
    }
  },

  async getExpertBatches(): Promise<ExpertBatch[]> {
    const url = `${API_BASE_URL}/expert-feature/experts/batches/`;

    try {
      if (expertBatchesCache) {
        return expertBatchesCache;
      }

      if (expertBatchesPromise) {
        return await expertBatchesPromise;
      }

      expertBatchesPromise = (async () => {
        const response = await withTimeout(url, {
          method: "GET",
          headers: await buildAuthorizedHeaders(),
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            expertBatchesCache = [];
            return [];
          }

          const errorBody = await safeReadBody(response);
          throw new Error(
            errorBody?.detail ||
              errorBody?.message ||
              `HTTP error! status: ${response.status}`
          );
        }

        const payload = await response.json();

        if (Array.isArray(payload)) {
          expertBatchesCache = payload;
          return payload;
        }

        if (payload && Array.isArray(payload.results)) {
          expertBatchesCache = payload.results;
          return payload.results;
        }

        expertBatchesCache = [];
        return [];
      })();

      try {
        return await expertBatchesPromise;
      } finally {
        expertBatchesPromise = null;
      }
    } catch (error) {
      console.error("Error fetching expert batches:", error);
      return [];
    }
  },
};

const fetchSeverityStats = async (endpoint: string, filter?: FilterState) => {
  const cacheKey = JSON.stringify({
    endpoint,
    filter: normalizeFilterForCache(filter),
  });

  if (severityCache.has(cacheKey)) {
    return severityCache.get(cacheKey);
  }

  if (severityPromiseCache.has(cacheKey)) {
    return await severityPromiseCache.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      if (filter) {
        const filterUrl = `${API_BASE_URL}/api/severity-stats/filter/`;

        const payload: Record<string, unknown> = {
          diseases: filter.diseases || [],
          locations: filter.locations || [],
          portals: filter.portals || [],
          level_of_alertness: filter.level_of_alertness || 0,
          start_date: normalizeDateValue(filter.start_date),
          end_date: normalizeDateValue(filter.end_date),
        };

        if (filter.batch !== undefined) {
          payload.batch = filter.batch ?? null;
        }

        const data = await fetchJson<any>(
          filterUrl,
          {
            method: "POST",
            headers: await buildAuthorizedHeaders(),
            credentials: "include",
            body: JSON.stringify(payload),
          },
          `Gagal mengambil severity stats terfilter dari ${filterUrl}`
        );

        severityCache.set(cacheKey, data);
        return data;
      }

      const url = `${API_BASE_URL}${endpoint}`;

      const data = await fetchJson<any>(
        url,
        {
          method: "GET",
          headers: await buildAuthorizedHeaders(),
          credentials: "include",
        },
        `Gagal mengambil severity stats dari ${url}`
      );

      const mapped = Array.isArray(data?.data)
        ? data.data.map((item: any) => ({
            name: item.name,
            hospitalisasi: item.severity_counts?.hospitalisasi ?? 0,
            insiden: item.severity_counts?.insiden ?? 0,
            mortalitas: item.severity_counts?.mortalitas ?? 0,
            total_cases: item.total_cases ?? 0,
          }))
        : [];

      severityCache.set(cacheKey, mapped);
      return mapped;
    } catch (error) {
      console.error(`Error fetching severity stats from ${endpoint}:`, error);
      throw error;
    }
  })();

  severityPromiseCache.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    severityPromiseCache.delete(cacheKey);
  }
};

export const severityApi = {
  getDiseaseSeverityStats: (filter?: FilterState) =>
    fetchSeverityStats("/api/diseases/severity-stats/", filter),

  getProvinceSeverityStats: (filter?: FilterState) =>
    fetchSeverityStats("/api/locations/province/severity-stats/", filter),

  getCitySeverityStats: (filter?: FilterState) =>
    fetchSeverityStats("/api/locations/city/severity-stats/", filter),

  getFilteredSeverityStats: (filter: FilterState) =>
    fetchSeverityStats("/api/severity-stats/filter/", filter),
};

export const registryApi = {
  async getDiseases(): Promise<string[]> {
    const endpoints = [
      `${API_BASE_URL}/api/diseases/`,
      `${API_BASE_URL}/diseases/`,
      `${API_BASE_URL}/cases/diseases/`,
    ];

    for (const url of endpoints) {
      try {
        const data = await fetchJson<any>(
          url,
          {
            method: "GET",
            headers: await buildAuthorizedHeaders(),
            credentials: "include",
          },
          `Gagal mengambil diseases dari ${url}`
        );

        if (Array.isArray(data)) {
          return data.map((item: any) =>
            typeof item === "string" ? item : item.name || String(item)
          );
        }

        return [];
      } catch (error) {
        console.warn(`getDiseases: failed to fetch from ${url}:`, error);
        continue;
      }
    }

    const err = new Error("Unable to fetch diseases from known endpoints");
    (err as any).endpointNotFound = true;
    console.error("Error fetching diseases:", err);
    throw err;
  },

  async createDisease(name: string): Promise<any> {
    const endpoints = [
      `${API_BASE_URL}/api/diseases/`,
      `${API_BASE_URL}/diseases/`,
      `${API_BASE_URL}/cases/diseases/`,
    ];

    for (const url of endpoints) {
      try {
        const data = await fetchJson<any>(
          url,
          {
            method: "POST",
            headers: await buildAuthorizedHeaders(),
            credentials: "include",
            body: JSON.stringify({ name }),
          },
          `Gagal membuat disease di ${url}`
        );

        if (typeof data === "string") return { name: data };
        if (data && typeof data === "object") {
          const nameVal = data.name || data.title || data.label || null;
          return { ...data, name: nameVal || name };
        }

        return { name };
      } catch (error) {
        console.warn("createDisease attempt failed:", error);
        continue;
      }
    }

    const err = new Error("Unable to create disease; all endpoints failed");
    (err as any).endpointNotFound = true;
    console.error("Error creating disease:", err);
    throw err;
  },

  async createLocation(
    name: string,
    latitude?: number | null,
    longitude?: number | null
  ): Promise<any> {
    const body: Record<string, any> = { name };

    if (latitude !== undefined && latitude !== null && !Number.isNaN(Number(latitude))) {
      body.latitude = Number(latitude);
    }

    if (longitude !== undefined && longitude !== null && !Number.isNaN(Number(longitude))) {
      body.longitude = Number(longitude);
    }

    const url = `${API_BASE_URL}/cases/locations/`;

    try {
      return await fetchJson<any>(
        url,
        {
          method: "POST",
          headers: await buildAuthorizedHeaders(),
          credentials: "include",
          body: JSON.stringify(body),
        },
        `Gagal membuat location di ${url}`
      );
    } catch (error) {
      console.error("Error creating location:", error);
      throw error;
    }
  },
};

export const logsApi = {
  async logDownload(params: {
    username?: string;
    chartType: string;
    timestamp: string;
  }) {
    const { username, chartType, timestamp } = params;
    const url = `${API_BASE_URL}/api/logs/download`;

    try {
      return await fetchJson<any>(
        url,
        {
          method: "POST",
          headers: buildPublicHeaders(),
          credentials: "include",
          body: JSON.stringify({
            username,
            chart_type: chartType,
            timestamp,
          }),
        },
        `Gagal mencatat log download ke ${url}`
      );
    } catch (error) {
      console.error("Error logging download event:", error);
      return { ok: false } as const;
    }
  },
};

export const emailSubmitAPI = {
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    const url = `${API_BASE_URL}/authentication/password-reset-request`;

    try {
      const response = await withTimeout(url, {
        method: "POST",
        headers: buildPublicHeaders(),
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        return { success: true };
      }

      const data = await safeReadBody(response);
      return {
        success: false,
        error:
          data?.error ||
          data?.detail ||
          "Terjadi kesalahan. Silakan coba lagi.",
      };
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return {
        success: false,
        error: "Terjadi kesalahan jaringan. Coba lagi nanti.",
      };
    }
  },
};

export const resetPasswordApi = {
  async resetPassword(
    uid: string,
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<any> {
    const url = `${API_BASE_URL}/authentication/password-reset-confirm/${uid}/${token}`;

    try {
      const data = await fetchJson<any>(
        url,
        {
          method: "POST",
          headers: buildPublicHeaders(),
          credentials: "include",
          body: JSON.stringify({
            password,
            "password-confirm": confirmPassword,
          }),
        },
        `Gagal reset password ke ${url}`
      );

      return data;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  },
};
