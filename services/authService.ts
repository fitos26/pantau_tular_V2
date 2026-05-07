import { LoginRequestBody } from "../types";
import { API_API_BASE } from "../config";

const API_BASE_URL = API_API_BASE;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const buildHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (API_KEY) {
    headers["x-api-key"] = String(API_KEY);
  }

  return headers;
};

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Helper function to handle API error responses
const handleApiError = async (response: Response, defaultMessage: string) => {
  let detail: unknown;
  let errorData: Record<string, unknown> | null = null;
  try {
    errorData = await response.json();
    detail = errorData?.detail ?? errorData?.message;
  } catch {
    detail = undefined;
  }

  const extractDetail = (): string | undefined => {
    if (!detail) return undefined;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return String(detail[0]).replace(/[[\]'\"]/g, '');
    }
    if (typeof detail === 'object') {
      const values = Object.values(detail as Record<string, unknown>);
      if (values.length > 0) {
        return String(values[0]);
      }
    }
    return undefined;
  };

  const extractTopLevelFieldError = (): string | undefined => {
    if (!errorData || typeof errorData !== 'object') return undefined;

    for (const [field, value] of Object.entries(errorData)) {
      if (field === 'detail' || field === 'message') continue;

      if (typeof value === 'string') {
        return value;
      }

      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }
    }

    return undefined;
  };

  const detailMessage = extractDetail() ?? extractTopLevelFieldError();
  const normalizedDetail = detailMessage?.toLowerCase() ?? '';
  const status = response.status;
  const isLoginContext = defaultMessage.toLowerCase().includes('masuk');

  const pickMessage = (): string => {
    if (
      status === 401 ||
      normalizedDetail.includes('unauthorized') ||
      normalizedDetail.includes('invalid credentials') ||
      normalizedDetail.includes('invalid email or password') ||
      normalizedDetail.includes('wrong password')
    ) {
      return isLoginContext ? 'Email atau kata sandi salah.' : 'Akses ditolak. Hubungi administrator Anda.';
    }

    if (status === 404 || normalizedDetail.includes('not found')) {
      return isLoginContext ? 'Akun tidak ditemukan.' : 'Data tidak ditemukan.';
    }

    if (normalizedDetail.includes('already exists')) {
      return 'Email sudah terdaftar. Silakan gunakan email lain.';
    }

    if (normalizedDetail.includes('at least 8 characters')) {
      return 'Kata sandi minimal 8 karakter.';
    }

    if (status === 403 || normalizedDetail.includes('inactive') || normalizedDetail.includes('forbidden')) {
      return isLoginContext ? 'Akses login ditolak. Hubungi administrator Anda.' : 'Akses ditolak. Hubungi administrator Anda.';
    }

    if (status === 429 || normalizedDetail.includes('too many')) {
      return isLoginContext
        ? 'Terlalu banyak percobaan login. Silakan coba lagi beberapa menit lagi.'
        : 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
    }

    if (status === 400 || status === 422 || normalizedDetail.includes('validation')) {
      if (isLoginContext && normalizedDetail.includes('invalid email or password')) {
        return 'Email atau kata sandi salah.';
      }
      return isLoginContext
        ? 'Data login tidak valid. Periksa kembali email dan kata sandi Anda.'
        : 'Data yang Anda kirimkan tidak valid. Silakan periksa kembali.';
    }

    if (status >= 500) {
      return 'Terjadi gangguan pada server. Silakan coba lagi nanti.';
    }

    return detailMessage ?? defaultMessage;
  };

  throw new Error(pickMessage());
};

export const authService = {
  register: async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
  return handleApiError(response, 'Terjadi kesalahan saat mendaftar');
    }

    return response.json();
  },

  login: async (data: LoginRequestBody) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...buildHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
  return handleApiError(response, 'Terjadi kesalahan saat masuk');
    }
    return response.json();
  },

  refresh: async (refreshToken: string) => {
    const response = await fetch(`${API_BASE_URL}/token/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...buildHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      return handleApiError(response, "Sesi Anda telah berakhir");
    }

    return response.json();
  }
};
