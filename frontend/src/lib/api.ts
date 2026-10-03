import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { AuthUser, PageMeta, Paged } from './types';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

/* ── In-memory token store (never persisted to localStorage) ── */
let accessToken: string | null = null;
type Listener = (user: AuthUser | null) => void;
const listeners = new Set<Listener>();

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
  onSessionChange: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit: (user: AuthUser | null) => listeners.forEach((l) => l(user)),
};

export const http = axios.create({ baseURL: API_URL, withCredentials: true });

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

/* ── Single-flight refresh ── */
let refreshing: Promise<string | null> | null = null;

export function refreshSession(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const { accessToken: token, user } = res.data.data as { accessToken: string; user: AuthUser };
        tokenStore.set(token);
        tokenStore.emit(user);
        return token;
      })
      .catch(() => {
        tokenStore.set(null);
        tokenStore.emit(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = original?.url ?? '';
    if (error.response?.status === 401 && original && !original._retried && !url.includes('/auth/')) {
      original._retried = true;
      const token = await refreshSession();
      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`);
        return http(original);
      }
    }
    return Promise.reject(error);
  },
);

/* ── Envelope helpers ── */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.get(url, config);
  return res.data.data as T;
}

export async function getPaged<T>(url: string, params?: Record<string, unknown>): Promise<Paged<T>> {
  const res = await http.get(url, { params: cleanParams(params) });
  const meta: PageMeta = res.data.meta ?? { page: 1, pageSize: res.data.data?.length ?? 0, total: res.data.data?.length ?? 0, totalPages: 1 };
  return { data: res.data.data as T[], meta };
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.post(url, body, config);
  return res.data.data as T;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.patch(url, body);
  return res.data.data as T;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.put(url, body);
  return res.data.data as T;
}

export async function del<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.delete(url, body === undefined ? undefined : { data: body });
  return res.data?.data as T;
}

export function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    out[k] = v;
  }
  return out;
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string; details?: { path: string; message: string }[] } } | undefined;
    const details = data?.error?.details;
    if (Array.isArray(details) && details.length) return details.map((d) => `${d.path ? d.path + ': ' : ''}${d.message}`).join(' · ');
    if (data?.error?.message) return data.error.message;
    if (!err.response) return 'Cannot reach the server. Check your connection.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Build multipart form data from fields + files. Objects/arrays are JSON encoded. */
export function toFormData(fields: Record<string, unknown>, files: Record<string, File[]> = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === '') continue;
    fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  for (const [field, list] of Object.entries(files)) list.forEach((f) => fd.append(field, f));
  return fd;
}

/** Download a CSV/raw response via an authenticated request. */
export async function downloadFile(url: string, params: Record<string, unknown>, filename: string) {
  const res = await http.get(url, { params: cleanParams(params), responseType: 'blob' });
  const href = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
