import { config } from '@/config';

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
};

function toApiError(status: number, body: any): ApiError {
  const normalized: ApiError = {
    status,
    code: body?.code,
    message: body?.message || body?.error || `Request failed with status ${status}`,
    details: body?.details,
  };
  return normalized;
}

export async function apiFetch<T>(path: string, init?: RequestInit & { skipAuth?: boolean }): Promise<T> {
  const url = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  };

  // Attach bearer token if present and not explicitly skipped
  if (!init?.skipAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(init?.headers || {}),
    },
    mode: 'cors'
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);

  if (!response.ok) {
    throw toApiError(response.status, body);
  }

  return (body as T);
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, data?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'PUT', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'DELETE' }),
};


