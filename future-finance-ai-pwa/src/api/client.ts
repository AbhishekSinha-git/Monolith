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

export type ApiOptions<T = unknown> = Omit<RequestInit, 'body'> & {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
  body?: T;
};

async function prepareRequest<T>(path: string, init?: ApiOptions<T>): Promise<[string, RequestInit]> {
  let url = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
  
  // Handle query parameters
  if (init?.params) {
    const params = new URLSearchParams();
    Object.entries(init.params).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    url = `${url}?${params.toString()}`;
  }

  // Prepare headers with auth token if needed
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
  };

  if (!init?.skipAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Only spread valid RequestInit fields, not custom ApiOptions fields
  const { body, params, skipAuth, ...requestInitRest } = init || {};
  const requestInit: RequestInit = {
    ...requestInitRest,
    headers,
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  return [url, requestInit];
}

export async function apiFetch<T, B = unknown>(path: string, init?: ApiOptions<B>): Promise<T> {
  const [url, requestInit] = await prepareRequest(path, init);
  const response = await fetch(url, requestInit);

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }
    throw toApiError(response.status, errorBody);
  }

  return response.json();
}

export const http = {
  get: <T>(path: string, init?: Omit<ApiOptions, 'body' | 'method'>) =>
    apiFetch<T>(path, { ...init, method: 'GET' }),

  post: <T, B = unknown>(path: string, body?: B, init?: Omit<ApiOptions<B>, 'body' | 'method'>) =>
    apiFetch<T, B>(path, { ...init, body, method: 'POST' }),

  put: <T, B = unknown>(path: string, body?: B, init?: Omit<ApiOptions<B>, 'body' | 'method'>) =>
    apiFetch<T, B>(path, { ...init, body, method: 'PUT' }),

  patch: <T, B = unknown>(path: string, body?: B, init?: Omit<ApiOptions<B>, 'body' | 'method'>) =>
    apiFetch<T, B>(path, { ...init, body, method: 'PATCH' }),

  delete: <T>(path: string, init?: Omit<ApiOptions, 'body' | 'method'>) =>
    apiFetch<T>(path, { ...init, method: 'DELETE' }),
};